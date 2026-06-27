import os
from pathlib import Path


API_DIR = Path(__file__).resolve().parent
CATVTON_ROOT = API_DIR.parent


class Settings:
    model_name = "CatVTON"
    device = os.getenv("CATVTON_DEVICE", "cuda")

    base_model_path = os.getenv(
        "CATVTON_BASE_MODEL_PATH",
        "booksforcharlie/stable-diffusion-inpainting",
    )
    resume_path = os.getenv("CATVTON_RESUME_PATH", "zhengchong/CatVTON")
    output_dir = os.getenv("CATVTON_OUTPUT_DIR", "resource/demo/output")

    width = int(os.getenv("CATVTON_WIDTH", "768"))
    height = int(os.getenv("CATVTON_HEIGHT", "1024"))
    mixed_precision = os.getenv("CATVTON_MIXED_PRECISION", "bf16")
    allow_tf32 = os.getenv("CATVTON_ALLOW_TF32", "true").lower() == "true"

    num_inference_steps = int(os.getenv("CATVTON_NUM_INFERENCE_STEPS", "50"))
    guidance_scale = float(os.getenv("CATVTON_GUIDANCE_SCALE", "2.5"))
    seed = int(os.getenv("CATVTON_SEED", "42"))

    upload_person_dir = API_DIR / "uploads" / "persons"
    upload_cloth_dir = API_DIR / "uploads" / "clothes"
    api_output_dir = API_DIR / "outputs"

    allowed_cloth_types = {"upper", "lower", "overall"}
    allowed_image_formats = {"JPEG", "PNG", "WEBP", "BMP"}
    cors_origins = [
        origin.strip()
        for origin in os.getenv("CATVTON_CORS_ORIGINS", "*").split(",")
        if origin.strip()
    ]


settings = Settings()


def ensure_directories() -> None:
    settings.upload_person_dir.mkdir(parents=True, exist_ok=True)
    settings.upload_cloth_dir.mkdir(parents=True, exist_ok=True)
    settings.api_output_dir.mkdir(parents=True, exist_ok=True)
