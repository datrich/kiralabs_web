from contextlib import asynccontextmanager
from io import BytesIO
from pathlib import Path
from uuid import uuid4

import torch
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError
from starlette.concurrency import run_in_threadpool

from config import ensure_directories, settings
from model_service import CatVTONService, ModelNotLoadedError
from schemas import HealthResponse, TryOnResponse


service = CatVTONService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_directories()
    try:
        service.load_model()
    except Exception as exc:
        service.load_error = str(exc)
    yield


app = FastAPI(title="CatVTON API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
ensure_directories()
app.mount("/outputs", StaticFiles(directory=str(settings.api_output_dir)), name="outputs")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "error": "Missing or invalid multipart/form-data fields.",
            "detail": exc.errors(),
        },
    )


def _error(status_code: int, message: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail={"success": False, "error": message})


async def _save_valid_image(upload: UploadFile, output_dir: Path, prefix: str, job_id: str) -> str:
    if upload is None:
        raise _error(400, f"{prefix}_image is required.")

    data = await upload.read()
    if not data:
        raise _error(400, f"{prefix}_image is empty.")

    try:
        with Image.open(BytesIO(data)) as image:
            image.verify()
        with Image.open(BytesIO(data)) as image:
            if image.format not in settings.allowed_image_formats:
                raise _error(400, f"{prefix}_image must be JPEG, PNG, WEBP, or BMP.")
            image = image.convert("RGB")
            output_path = output_dir / f"{prefix}_{job_id}.png"
            image.save(output_path)
            return str(output_path)
    except UnidentifiedImageError:
        raise _error(400, f"{prefix}_image is not a valid image.")
    except OSError:
        raise _error(400, f"{prefix}_image is not a valid image.")


def _result_url(request: Request, result_path: str) -> str:
    filename = Path(result_path).name
    base_url = str(request.base_url).rstrip("/")
    return f"{base_url}/outputs/{filename}"


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        model=settings.model_name,
        device=settings.device,
    )


@app.post("/api/try-on", response_model=TryOnResponse)
async def try_on(
    request: Request,
    person_image: UploadFile = File(...),
    cloth_image: UploadFile = File(...),
    cloth_type: str = Form(...),
) -> TryOnResponse:
    cloth_type = cloth_type.strip().lower()
    if cloth_type not in settings.allowed_cloth_types:
        raise _error(400, "cloth_type must be one of: upper, lower, overall.")
    if not service.is_loaded:
        raise _error(503, service.load_error or "CatVTON model is not loaded.")

    job_id = uuid4().hex
    person_path = await _save_valid_image(
        person_image,
        settings.upload_person_dir,
        "person",
        job_id,
    )
    cloth_path = await _save_valid_image(
        cloth_image,
        settings.upload_cloth_dir,
        "cloth",
        job_id,
    )
    result_path = str(settings.api_output_dir / f"result_{job_id}.png")

    try:
        saved_result_path = await run_in_threadpool(
            service.run_tryon,
            person_path,
            cloth_path,
            cloth_type,
            result_path,
        )
    except ModelNotLoadedError as exc:
        raise _error(503, str(exc))
    except RuntimeError as exc:
        message = str(exc)
        if "out of memory" in message.lower():
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            raise _error(507, "CUDA out of memory while running CatVTON inference.")
        raise _error(500, f"Inference failed: {message}")
    except Exception as exc:
        raise _error(500, f"Inference failed: {exc}")

    return TryOnResponse(
        success=True,
        job_id=job_id,
        cloth_type=cloth_type,
        person_image_path=person_path,
        cloth_image_path=cloth_path,
        result_image_url=_result_url(request, saved_result_path),
    )
