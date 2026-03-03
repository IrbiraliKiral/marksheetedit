import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { DocumentState, InstructionQuestion, TableQuestion, TableRow, ElementConfig } from '@/types';

interface DocumentStore {
  docState: DocumentState;
  activeInstructionId: string | null;
  selectedElementId: string | null;

  // Actions
  updateHeader: (field: keyof Omit<DocumentState, 'questions' | 'elementConfigs' | 'settings'>, value: string) => void;
  updateSettings: (settings: Partial<NonNullable<DocumentState['settings']>>) => void;
  setActiveInstruction: (id: string | null) => void;
  setSelectedElement: (id: string | null) => void;
  updateElementConfig: (id: string, config: Partial<ElementConfig>) => void;

  // Question Actions
  addInstruction: (pageIndex: number) => void;
  addTable: (pageIndex: number) => void;
  addSubQuestion: (instructionId: string) => void;
  updateInstruction: (id: string, field: keyof InstructionQuestion, value: string) => void;
  updateSubQuestion: (instructionId: string, subQuestionId: string, field: keyof Omit<InstructionQuestion['subQuestions'][0], 'id'>, value: string) => void;
  updateTableRow: (tableId: string, rowId: string, field: keyof TableRow, value: string) => void;
  addTableRow: (tableId: string) => void;
  removeQuestion: (id: string) => void;
}

const INITIAL_STATE: DocumentState = {
  schoolName: '',
  session: '',
  examinationType: '',
  className: '',
  subjectName: '',
  fullMarks: '',
  time: '',
  questions: [],
  elementConfigs: {},
  settings: {
    efficientMode: false,
  }
};

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      docState: INITIAL_STATE,
      activeInstructionId: null,
      selectedElementId: null,

      updateHeader: (field, value) =>
        set((state) => ({
          docState: { ...state.docState, [field]: value }
        })),

      updateSettings: (settings: Partial<NonNullable<DocumentState['settings']>>) =>
        set((state) => ({
          docState: {
            ...state.docState,
            settings: { ...state.docState.settings, ...settings, efficientMode: settings.efficientMode ?? state.docState.settings?.efficientMode ?? false }
          }
        })),

      setActiveInstruction: (id) =>
        set({ activeInstructionId: id }),

      setSelectedElement: (id) =>
        set({ selectedElementId: id }),

      updateElementConfig: (id, config) =>
        set((state) => {
          const prevConfigs = state.docState.elementConfigs || {};
          const prevConfig = prevConfigs[id] || { id, type: 'text', isDraggable: false };
          return {
            docState: {
              ...state.docState,
              elementConfigs: {
                ...prevConfigs,
                [id]: { ...prevConfig, ...config }
              }
            }
          };
        }),

      addInstruction: (pageIndex: number) => {
        const newInstruction: InstructionQuestion = {
          id: uuidv4(),
          type: 'instruction',
          pageIndex,
          serialNumber: '',
          instruction: '',
          marks: '',
          subQuestions: []
        };
        set((state) => ({
          docState: {
            ...state.docState,
            questions: [...state.docState.questions, newInstruction]
          },
          activeInstructionId: newInstruction.id
        }));
      },

      addTable: (pageIndex: number) => {
        const newTable: TableQuestion = {
          id: uuidv4(),
          type: 'table',
          pageIndex,
          rows: Array.from({ length: 4 }).map(() => ({
            id: uuidv4(),
            columnA: '',
            columnB: ''
          }))
        };
        set((state) => ({
          docState: {
            ...state.docState,
            questions: [...state.docState.questions, newTable]
          }
        }));
      },

      addSubQuestion: (instructionId) => {
        set((state) => ({
          docState: {
            ...state.docState,
            questions: state.docState.questions.map(q => {
              if (q.id === instructionId && q.type === 'instruction') {
                return {
                  ...q,
                  subQuestions: [
                    ...q.subQuestions,
                    {
                      id: uuidv4(),
                      serialNumber: '',
                      instruction: '',
                      marks: ''
                    }
                  ]
                };
              }
              return q;
            })
          }
        }));
      },

      updateInstruction: (id, field, value) => {
        set((state) => ({
          docState: {
            ...state.docState,
            questions: state.docState.questions.map(q =>
              (q.id === id && q.type === 'instruction')
                ? { ...q, [field]: value }
                : q
            )
          }
        }));
      },

      updateSubQuestion: (instructionId, subQuestionId, field, value) => {
        set((state) => ({
          docState: {
            ...state.docState,
            questions: state.docState.questions.map(q => {
              if (q.id === instructionId && q.type === 'instruction') {
                return {
                  ...q,
                  subQuestions: q.subQuestions.map(sq =>
                    sq.id === subQuestionId
                      ? { ...sq, [field]: value }
                      : sq
                  )
                };
              }
              return q;
            })
          }
        }));
      },

      updateTableRow: (tableId, rowId, field, value) => {
        set((state) => ({
          docState: {
            ...state.docState,
            questions: state.docState.questions.map(q => {
              if (q.id === tableId && q.type === 'table') {
                return {
                  ...q,
                  rows: q.rows.map(row =>
                    row.id === rowId
                      ? { ...row, [field]: value }
                      : row
                  )
                };
              }
              return q;
            })
          }
        }));
      },

      addTableRow: (tableId) => {
        set((state) => ({
          docState: {
            ...state.docState,
            questions: state.docState.questions.map(q => {
              if (q.id === tableId && q.type === 'table') {
                return {
                  ...q,
                  rows: [...q.rows, { id: uuidv4(), columnA: '', columnB: '' }]
                };
              }
              return q;
            })
          }
        }));
      },

      removeQuestion: (id) => {
        set((state) => ({
          docState: {
            ...state.docState,
            questions: state.docState.questions.filter(q => q.id !== id)
          },
          activeInstructionId: state.activeInstructionId === id ? null : state.activeInstructionId
        }));
      }
    }),
    {
      name: 'question-sheet-storage',
    }
  )
);
