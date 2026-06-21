import uuid
import logging
from typing import Annotated

from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile, status

from models.schemas import JobStatusResponse, OCRResult, OCRUploadResponse
from services import ocr_service
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ocr", tags=["ocr"])

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/tiff",
    "image/bmp",
    "image/webp",
}

_job_store: dict[str, OCRResult] = {}


def _verify_secret(x_api_secret: str | None) -> None:
    if settings.api_secret and x_api_secret != settings.api_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API secret")


def _validate_upload(file: UploadFile) -> None:
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}. Allowed: PDF, JPG, PNG, TIFF, BMP, WEBP",
        )


async def _read_file(file: UploadFile) -> bytes:
    data = await file.read()
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.max_file_size_mb} MB limit",
        )
    return data


# ─── POST /ocr/extract ────────────────────────────────────────────────────────

@router.post("/extract", response_model=OCRResult)
async def extract(
    file: Annotated[UploadFile, File(description="PDF, JPG or PNG invoice")],
    lang: Annotated[str, Form()] = "",
    psm: Annotated[int, Form()] = 3,
    x_api_secret: Annotated[str | None, Header()] = None,
) -> OCRResult:
    """Synchronous extraction — returns OCR result in one HTTP call."""
    _verify_secret(x_api_secret)
    _validate_upload(file)
    data = await _read_file(file)

    effective_lang = lang.strip() or settings.default_lang
    result = ocr_service.extract_text(
        file_bytes=data,
        mime_type=file.content_type or "application/octet-stream",
        lang=effective_lang,
        tesseract_cmd=settings.tesseract_cmd,
        tessdata_prefix=settings.tessdata_prefix,
        psm=psm,
    )
    return result


# ─── POST /ocr/upload ─────────────────────────────────────────────────────────

@router.post("/upload", response_model=OCRUploadResponse)
async def upload(
    file: Annotated[UploadFile, File(description="PDF, JPG or PNG invoice")],
    lang: Annotated[str, Form()] = "",
    psm: Annotated[int, Form()] = 3,
    x_api_secret: Annotated[str | None, Header()] = None,
) -> OCRUploadResponse:
    """Upload + extract. Returns a job_id for future async tracking."""
    _verify_secret(x_api_secret)
    _validate_upload(file)
    data = await _read_file(file)

    effective_lang = lang.strip() or settings.default_lang
    job_id = str(uuid.uuid4())

    result = ocr_service.extract_text(
        file_bytes=data,
        mime_type=file.content_type or "application/octet-stream",
        lang=effective_lang,
        tesseract_cmd=settings.tesseract_cmd,
        tessdata_prefix=settings.tessdata_prefix,
        psm=psm,
    )

    _job_store[job_id] = result

    return OCRUploadResponse(
        success=result.success,
        job_id=job_id,
        raw_text=result.raw_text,
        confidence=result.confidence,
        language=result.language,
        pages=result.pages,
        processing_time_ms=result.processing_time_ms,
        error=result.error,
    )


# ─── GET /ocr/status/{job_id} ─────────────────────────────────────────────────

@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def job_status(
    job_id: str,
    x_api_secret: Annotated[str | None, Header()] = None,
) -> JobStatusResponse:
    """Check the result of a previously submitted upload job."""
    _verify_secret(x_api_secret)

    result = _job_store.get(job_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    return JobStatusResponse(
        job_id=job_id,
        status="completed" if result.success else "failed",
        result=result,
    )
