import io

from PIL import Image, ImageEnhance, ImageOps

from app.config import get_settings

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/jpg"}


class ImageValidationError(ValueError):
    pass


def preprocess(raw_bytes: bytes) -> tuple[bytes, str]:
    """Normalise an uploaded photo for the vision model.

    Deliberately gentle: EXIF rotation, downscale, and a mild contrast lift.
    Aggressive denoising or binarisation destroys faint chalk and pencil
    strokes, which costs more accuracy than it gains.
    """
    settings = get_settings()

    try:
        image = Image.open(io.BytesIO(raw_bytes))
        image.load()
    except Exception as exc:  # noqa: BLE001 - Pillow raises many unrelated types
        raise ImageValidationError("The uploaded file is not a readable image.") from exc

    image = ImageOps.exif_transpose(image)
    if image.mode != "RGB":
        image = image.convert("RGB")

    limit = settings.max_image_dimension
    if max(image.size) > limit:
        image.thumbnail((limit, limit), Image.LANCZOS)

    image = ImageEnhance.Contrast(image).enhance(1.15)
    image = ImageEnhance.Sharpness(image).enhance(1.30)

    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=90, optimize=True)
    return buffer.getvalue(), "image/jpeg"


def validate_upload(content_type: str | None, size: int) -> None:
    settings = get_settings()

    if content_type and content_type.lower() not in ALLOWED_CONTENT_TYPES:
        raise ImageValidationError(
            f"Unsupported file type '{content_type}'. Upload a JPEG, PNG or WebP image."
        )
    if size == 0:
        raise ImageValidationError("The uploaded file is empty.")
    if size > settings.max_upload_bytes:
        raise ImageValidationError(
            f"Image is larger than the {settings.max_upload_size_mb} MB limit."
        )
