export type QuestionType = 'instruction' | 'table';

export type InlineSegment =
  | { type: 'text'; id: string; value: string }
  | { type: 'fraction'; id: string; numerator: string; denominator: string };

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  pageIndex: number;
}

export interface InstructionQuestion extends BaseQuestion {
  type: 'instruction';
  serialNumber: string;
  instruction: string;
  marks: string;
  subQuestions: SubQuestion[];
  // Inline rich content — when present, overrides the plain `instruction` string
  content?: InlineSegment[];
}

export interface SubQuestion {
  id: string;
  serialNumber: string;
  instruction: string;
  marks: string;
  // Inline rich content — when present, overrides the plain `instruction` string
  content?: InlineSegment[];
}

export interface TableQuestion extends BaseQuestion {
  type: 'table';
  rows: TableRow[];
}

export interface TableRow {
  id: string;
  columnA: string;
  columnB: string;
}

export interface ElementConfig {
  id: string;
  type: string;
  isDraggable: boolean;
  fontSize?: string;
  x?: number;
  y?: number;
  content?: string;
}

export interface DocumentState {
  schoolName: string;
  session: string;
  examinationType: string;
  className: string;
  subjectName: string;
  fullMarks: string;
  time: string;
  questions: (InstructionQuestion | TableQuestion)[];
  elementConfigs?: Record<string, ElementConfig>;
  settings?: {
    efficientMode: boolean;
  };
}
