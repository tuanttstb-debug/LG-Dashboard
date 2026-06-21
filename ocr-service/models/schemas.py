from pydantic import BaseModel, Field
from typing import Optional


class OCRResult(BaseModel):
    success: bool
    raw_text: str = ""
    confidence: float = Field(0.0, ge=0.0, le=100.0)
    language: str = "vie+eng"
    pages: int = 1
    processing_time_ms: int = 0
    error: Optional[str] = None


class OCRUploadResponse(BaseModel):
    success: bool
    job_id: str
    raw_text: str = ""
    confidence: float = Field(0.0, ge=0.0, le=100.0)
    language: str = "vie+eng"
    pages: int = 1
    processing_time_ms: int = 0
    error: Optional[str] = None


class JobStatusResponse(BaseModel):
    job_id: str
    status: str  # "completed" | "processing" | "failed"
    result: Optional[OCRResult] = None


class HealthResponse(BaseModel):
    status: str
    tesseract_version: str
    languages: list[str]
