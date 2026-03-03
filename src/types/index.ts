export type QuestionType = 'instruction' | 'table';

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  pageIndex: number; // Added to track which page the question is on
}

export interface InstructionQuestion extends BaseQuestion {
  type: 'instruction';
  serialNumber: string;
  instruction: string;
  marks: string;
  subQuestions: SubQuestion[];
}

export interface SubQuestion {
  id: string;
  serialNumber: string;
  instruction: string;
  marks: string;
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
  // Generic text content if needed, though most elements use docState for their content
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
