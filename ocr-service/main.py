import logging
import subprocess

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models.schemas import HealthResponse
from routers import ocr as ocr_router

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="LG Dashboard — OCR Microservice",
    description="Tesseract OCR service supporting Vietnamese and English invoices",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(ocr_router.router)


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    try:
        raw = subprocess.check_output(
            [settings.tesseract_cmd, "--version"],
            stderr=subprocess.STDOUT,
            text=True,
        )
        version = raw.splitlines()[0].replace("tesseract", "").strip()
    except Exception as exc:
        version = f"unavailable ({exc})"

    try:
        import os, pytesseract
        pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd
        os.environ["TESSDATA_PREFIX"] = settings.tessdata_prefix
        langs = pytesseract.get_languages()
    except Exception:
        langs = []

    return HealthResponse(status="ok", tesseract_version=version, languages=langs)


@app.on_event("startup")
def on_startup() -> None:
    logger.info("OCR service starting — tesseract: %s", settings.tesseract_cmd)
    logger.info("Tessdata prefix: %s", settings.tessdata_prefix)
    logger.info("Default lang: %s", settings.default_lang)
    logger.info("CORS origins: %s", settings.cors_origin_list)
