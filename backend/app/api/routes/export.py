from fastapi import APIRouter
from fastapi.responses import Response

from app.schemas.analysis import ExportRequest
from app.services.markdown_service import build_filename, build_markdown

router = APIRouter()


@router.post("/export/markdown")
async def export_markdown(payload: ExportRequest) -> Response:
    markdown = build_markdown(payload.result, payload.highlights)
    filename = build_filename(payload.result.title, "md")

    return Response(
        content=markdown.encode("utf-8"),
        media_type="text/markdown; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )
