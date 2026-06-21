import os
import time
import logging
from PIL import Image, ImageFilter, ImageOps
import pytesseract
from pytesseract import Output
from .pdf_service import pdf_bytes_to_images, image_bytes_to_pil
from models.schemas import OCRResult

logger = logging.getLogger(__name__)


def _configure_tesseract(tesseract_cmd: str, tessdata_prefix: str) -> None:
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
    os.environ["TESSDATA_PREFIX"] = tessdata_prefix


def _preprocess(image: Image.Image) -> Image.Image:
    """Convert to greyscale + mild sharpening to improve OCR on scanned docs."""
    grey = ImageOps.grayscale(image)
    sharpened = grey.filter(ImageFilter.SHARPEN)
    return sharpened


def _ocr_image(image: Image.Image, lang: str, config: str) -> tuple[str, float]:
    """Run Tesseract on one PIL image; return (text, mean_confidence)."""
    preprocessed = _preprocess(image)

    try:
        data = pytesseract.image_to_data(
            preprocessed, lang=lang, config=config, output_type=Output.DICT
        )
        confidences = [int(c) for c in data["conf"] if str(c).lstrip("-").isdigit() and int(c) >= 0]
        mean_conf = sum(confidences) / len(confidences) if confidences else 0.0
    except Exception:
        mean_conf = 0.0

    text = pytesseract.image_to_string(preprocessed, lang=lang, config=config)
    return text.strip(), round(mean_conf, 2)


def extract_text(
    file_bytes: bytes,
    mime_type: str,
    lang: str,
    tesseract_cmd: str,
    tessdata_prefix: str,
    psm: int = 3,
) -> OCRResult:
    """
    Main extraction entry point.

    Returns OCRResult with aggregated text and average confidence across all pages.
    """
    _configure_tesseract(tesseract_cmd, tessdata_prefix)

    start = time.monotonic()
    tess_config = f"--psm {psm}"

    try:
        if mime_type == "application/pdf":
            images = pdf_bytes_to_images(file_bytes)
        else:
            images = image_bytes_to_pil(file_bytes)

        page_texts: list[str] = []
        page_confidences: list[float] = []

        for idx, img in enumerate(images):
            logger.debug("OCR page %d/%d lang=%s", idx + 1, len(images), lang)
            text, conf = _ocr_image(img, lang, tess_config)
            page_texts.append(text)
            page_confidences.append(conf)

        raw_text = "\n\n".join(page_texts)
        avg_confidence = (
            round(sum(page_confidences) / len(page_confidences), 2)
            if page_confidences
            else 0.0
        )
        elapsed_ms = int((time.monotonic() - start) * 1000)

        logger.info(
            "OCR complete: pages=%d conf=%.1f time=%dms lang=%s",
            len(images), avg_confidence, elapsed_ms, lang,
        )

        return OCRResult(
            success=True,
            raw_text=raw_text,
            confidence=avg_confidence,
            language=lang,
            pages=len(images),
            processing_time_ms=elapsed_ms,
        )

    except Exception as exc:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        logger.exception("OCR failed: %s", exc)
        return OCRResult(
            success=False,
            error=str(exc),
            processing_time_ms=elapsed_ms,
        )
