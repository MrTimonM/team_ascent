from fastapi import APIRouter

from app.api.routes import analyze, export, health

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router, tags=["health"])
api_router.include_router(analyze.router, tags=["analysis"])
api_router.include_router(export.router, tags=["export"])
