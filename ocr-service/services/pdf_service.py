import io
from PIL import Image
import pypdfium2 as pdfium


def pdf_bytes_to_images(data: bytes, dpi: int = 300) -> list[Image.Image]:
    """Convert each page of a PDF to a PIL Image at the given DPI."""
    doc = pdfium.PdfDocument(data)
    images: list[Image.Image] = []

    scale = dpi / 72  # pdfium uses 72 dpi as base
    for page in doc:
        bitmap = page.render(scale=scale, rotation=0)
        pil_image = bitmap.to_pil()
        images.append(pil_image)
        page.close()

    doc.close()
    return images


def image_bytes_to_pil(data: bytes) -> list[Image.Image]:
    """Wrap a raster image (JPG/PNG) as a single-element list."""
    img = Image.open(io.BytesIO(data))
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    return [img]
