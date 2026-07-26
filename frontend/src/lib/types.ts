export interface KeyConcept {
  name: string;
  definition: string;
}

export interface CodeBlock {
  language: string;
  original_code: string;
  corrected_code: string;
  explanation: string;
}

export interface UncertainContent {
  text: string;
  confidence: number;
  reason: string;
}

export type NodeCategory =
  | "main"
  | "subtopic"
  | "definition"
  | "example"
  | "code"
  | "error"
  | "exam";

export interface MindMapNode {
  id: string;
  label: string;
  category: NodeCategory;
  description: string;
}

export interface MindMapEdge {
  source: string;
  target: string;
  relationship: string;
}

export interface MindMap {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty: Difficulty;
  topic: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface ExamQuestion {
  question: string;
  marks: number;
  answer_outline: string;
}

export interface AnalysisResult {
  title: string;
  subject: string;
  languages: string[];
  confidence_score: number;
  extracted_text: string;
  clean_notes: string;
  bangla_explanation: string;
  key_concepts: KeyConcept[];
  code_blocks: CodeBlock[];
  uncertain_content: UncertainContent[];
  mindmap: MindMap;
  mermaid: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  exam_questions: ExamQuestion[];
  revision_summary: string;
}

export type HighlightCategory =
  | "important"
  | "definition"
  | "difficult"
  | "understood";

export interface Highlight {
  id: string;
  section_id: string;
  selected_text: string;
  category: HighlightCategory;
  start_offset: number;
  end_offset: number;
}

export type SectionId =
  | "upload"
  | "guide"
  | "mindmap"
  | "flashcards"
  | "quiz"
  | "highlights"
  | "export";
