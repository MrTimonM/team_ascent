from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.flashcard import ExamQuestion, Flashcard, QuizQuestion
from app.schemas.highlight import Highlight
from app.schemas.mindmap import MindMap


class KeyConcept(BaseModel):
    name: str
    definition: str = ""


class CodeBlock(BaseModel):
    language: str = "text"
    original_code: str = ""
    corrected_code: str = ""
    explanation: str = ""


class UncertainContent(BaseModel):
    text: str
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    reason: str = ""


class AnalysisResult(BaseModel):
    """The contract between Gemma and the frontend.

    Every list defaults to empty so a partial model response still renders a
    usable workspace instead of failing validation outright.
    """

    title: str = "Untitled Notes"
    subject: str = "General"
    languages: list[str] = Field(default_factory=list)
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)

    extracted_text: str = ""
    clean_notes: str = ""
    bangla_explanation: str = ""

    key_concepts: list[KeyConcept] = Field(default_factory=list)
    code_blocks: list[CodeBlock] = Field(default_factory=list)
    uncertain_content: list[UncertainContent] = Field(default_factory=list)

    mindmap: MindMap = Field(default_factory=MindMap)
    mermaid: str = ""

    flashcards: list[Flashcard] = Field(default_factory=list)
    quiz: list[QuizQuestion] = Field(default_factory=list)
    exam_questions: list[ExamQuestion] = Field(default_factory=list)

    revision_summary: str = ""


class ExportRequest(BaseModel):
    result: AnalysisResult
    highlights: list[Highlight] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: Literal["healthy", "degraded"]
    application: str
    model: str
    api_key_configured: bool
