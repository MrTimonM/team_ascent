from pydantic import BaseModel, Field


class Flashcard(BaseModel):
    id: str = ""
    question: str
    answer: str = ""
    difficulty: str = "beginner"
    topic: str = ""


class QuizQuestion(BaseModel):
    question: str
    options: list[str] = Field(default_factory=list)
    correct_answer: str = ""
    explanation: str = ""


class ExamQuestion(BaseModel):
    question: str
    marks: int = 5
    answer_outline: str = ""
