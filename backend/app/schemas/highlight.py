from pydantic import BaseModel


class Highlight(BaseModel):
    id: str
    section_id: str = ""
    selected_text: str
    category: str = "important"
    start_offset: int = 0
    end_offset: int = 0
