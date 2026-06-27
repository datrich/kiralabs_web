import sys
import threading
from pathlib import Path

import torch
from diffusers.image_processor import VaeImageProcessor
from huggingface_hub import snapshot_download
from PIL import Image

from config import CATVTON_ROOT, settings

if str(CATVTON_ROOT) not in sys.path:
    sys.path.insert(0, str(CATVTON_ROOT))

from model.cloth_masker import AutoMasker
from model.pipeline import CatVTONPipeline
from utils import init_weight_dtype, resize_and_crop, resize_and_padding


class ModelNotLoadedError(RuntimeError):
    pass


class CatVTONService:
    def __init__(self) -> None:
        self.pipeline = None
        self.automasker = None
        self.mask_processor = None
        self.repo_path = None
        self.load_error = None
        self._lock = threading.Lock()

    @property
    def is_loaded(self) -> bool:
        return self.pipeline is not None and self.automasker is not None

    def load_model(self) -> None:
        if self.is_loaded:
            return
        if settings.device == "cuda" and not torch.cuda.is_available():
            self.load_error = "CUDA is not available."
            raise ModelNotLoadedError(self.load_error)

        self.repo_path = snapshot_download(repo_id=settings.resume_path)
        self.pipeline = CatVTONPipeline(
            base_ckpt=settings.base_model_path,
            attn_ckpt=self.repo_path,
            attn_ckpt_version="mix",
            weight_dtype=init_weight_dtype(settings.mixed_precision),
            use_tf32=settings.allow_tf32,
            device=settings.device,
        )
        self.mask_processor = VaeImageProcessor(
            vae_scale_factor=8,
            do_normalize=False,
            do_binarize=True,
            do_convert_grayscale=True,
        )
        self.automasker = AutoMasker(
            densepose_ckpt=str(Path(self.repo_path) / "DensePose"),
            schp_ckpt=str(Path(self.repo_path) / "SCHP"),
            device=settings.device,
        )
        self.load_error = None

    def run_tryon(
        self,
        person_image_path: str,
        cloth_image_path: str,
        cloth_type: str,
        output_path: str,
    ) -> str:
        if not self.is_loaded:
            raise ModelNotLoadedError(self.load_error or "CatVTON model is not loaded.")
        if cloth_type not in settings.allowed_cloth_types:
            raise ValueError(f"Invalid cloth_type: {cloth_type}")

        with self._lock:
            person_image = Image.open(person_image_path).convert("RGB")
            cloth_image = Image.open(cloth_image_path).convert("RGB")
            person_image = resize_and_crop(person_image, (settings.width, settings.height))
            cloth_image = resize_and_padding(cloth_image, (settings.width, settings.height))

            mask = self.automasker(person_image, cloth_type)["mask"]
            mask = resize_and_crop(mask, (settings.width, settings.height))
            mask = self.mask_processor.blur(mask, blur_factor=9)

            generator = None
            if settings.seed != -1:
                generator = torch.Generator(device=settings.device).manual_seed(settings.seed)

            result_image = self.pipeline(
                image=person_image,
                condition_image=cloth_image,
                mask=mask,
                num_inference_steps=settings.num_inference_steps,
                guidance_scale=settings.guidance_scale,
                generator=generator,
            )[0]

            output = Path(output_path)
            output.parent.mkdir(parents=True, exist_ok=True)
            result_image.save(output)

            if settings.device == "cuda":
                torch.cuda.empty_cache()

            return str(output)
