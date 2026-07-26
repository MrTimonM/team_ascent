from fastapi import APIRouter

from app.config import get_settings
from app.schemas.analysis import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    settings = get_settings()
    configured = bool(settings.gemma_api_key)

    return HealthResponse(
        status="healthy" if configured else "degraded",
        application=settings.app_name,
        model=settings.gemma_model,
        api_key_configured=configured,
    )
