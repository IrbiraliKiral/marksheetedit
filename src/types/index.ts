export type QuestionType = 'instruction' | 'table';

export interface Fraction {
  id: string;
  numerator: string;
  denominator: string;
  x: number; // px offset from left of the question text area
  y: number; // px offset from top of the question text area
}

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
  fractions?: Fraction[]; // draggable fractions overlaid on the instruction text
}

export interface SubQuestion {
  id: string;
  serialNumber: string;
  instruction: string;
  marks: string;
  fractions?: Fraction[]; // draggable fractions overlaid on the sub-question text
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
    questionGap?: number;
  };
}
