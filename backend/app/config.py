from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "NoteKori"
    app_env: str = "development"

    api_host: str = "0.0.0.0"
    api_port: int = 8000

    gemma_api_key: str = ""
    gemma_api_base_url: str = "https://generativelanguage.googleapis.com/v1beta"
    gemma_model: str = "gemma-4-26b-a4b-it"

    frontend_origin: str = "http://localhost:3000"

    max_upload_size_mb: int = 10
    max_image_dimension: int = 1600
    # Thinking models spend part of this budget on reasoning before answering,
    # so it needs real headroom above the size of the JSON itself.
    max_output_tokens: int = 16384
    request_timeout_seconds: int = 300
    generated_files_directory: str = "generated"

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def generated_path(self) -> Path:
        path = BACKEND_ROOT / self.generated_files_directory
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origin.split(",") if origin.strip()]

    @property
    def supports_json_mode(self) -> bool:
        """Gemma models on the Gemini API reject responseMimeType and systemInstruction."""
        return not self.gemma_model.lower().startswith("gemma")


@lru_cache
def get_settings() -> Settings:
    return Settings()
