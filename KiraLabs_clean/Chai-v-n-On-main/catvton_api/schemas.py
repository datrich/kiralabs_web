from pydantic import BaseModel


class TryOnResponse(BaseModel):
    success: bool
    job_id: str
    cloth_type: str
    person_image_path: str
    cloth_image_path: str
    result_image_url: str


class HealthResponse(BaseModel):
    status: str
    model: str
    device: str
