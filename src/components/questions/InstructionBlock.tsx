'use client';

import { InstructionQuestion } from '@/types';
import { useDocumentStore } from '@/store/documentStore';
import { SelectableElement } from '../editor/SelectableElement';

interface Props {
  question: InstructionQuestion;
  isActive: boolean;
  isGeneratingPdf: boolean;
}

export function InstructionBlock({ question, isActive, isGeneratingPdf }: Props) {
  const { updateInstruction, updateSubQuestion } = useDocumentStore();

  const handleResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  return (
    <div className="relative">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <SelectableElement id={`inst-serial-${question.id}`} type="text" defaultFontSize="12px">
            <input
              type="text"
              value={question.serialNumber}
              onChange={(e) => updateInstruction(question.id, 'serialNumber', e.target.value)}
              className="w-10 text-left bg-transparent border-none focus:outline-none px-1 placeholder-gray-400"
              placeholder="Q."
            />
          </SelectableElement>
          <SelectableElement id={`inst-text-${question.id}`} type="text" defaultFontSize="12px" className="flex-1">
            <textarea
              value={question.instruction}
              onChange={(e) => updateInstruction(question.id, 'instruction', e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none px-1 resize-none overflow-hidden placeholder-gray-400 block"
              placeholder="Write your instruction here..."
              style={{ minHeight: '24px' }}
              onInput={handleResize}
            />
          </SelectableElement>
          <div className="flex items-center gap-1 w-16">
            <span className="text-gray-400 no-print">[</span>
            <SelectableElement id={`inst-marks-${question.id}`} type="text" defaultFontSize="12px">
              <input
                type="text"
                value={question.marks}
                onChange={(e) => updateInstruction(question.id, 'marks', e.target.value)}
                className="w-8 text-center bg-transparent border-none focus:outline-none px-1 placeholder-gray-400"
                placeholder="M"
              />
            </SelectableElement>
            <span className="text-gray-400 no-print">]</span>
          </div>
        </div>

        {/* Sub Questions */}
        {question.subQuestions.length > 0 && (
          <div className="pl-12 flex flex-col gap-2">
            {question.subQuestions.map(sq => (
              <div key={sq.id} className="flex items-start gap-2">
                <SelectableElement id={`sub-serial-${sq.id}`} type="text" defaultFontSize="12px">
                  <input
                    type="text"
                    value={sq.serialNumber}
                    onChange={(e) => updateSubQuestion(question.id, sq.id, 'serialNumber', e.target.value)}
                    className="w-8 text-left bg-transparent border-none focus:outline-none px-1 placeholder-gray-400"
                    placeholder="i."
                  />
                </SelectableElement>
                <SelectableElement id={`sub-text-${sq.id}`} type="text" defaultFontSize="12px" className="flex-1">
                  <textarea
                    value={sq.instruction}
                    onChange={(e) => updateSubQuestion(question.id, sq.id, 'instruction', e.target.value)}
                    className="w-full bg-transparent border-none focus:outline-none px-1 resize-none overflow-hidden placeholder-gray-400 block"
                    placeholder="Write question here..."
                    style={{ minHeight: '24px' }}
                    onInput={handleResize}
                  />
                </SelectableElement>
                <div className="flex items-center gap-1 w-12">
                  <span className="text-gray-400 no-print">[</span>
                  <SelectableElement id={`sub-marks-${sq.id}`} type="text" defaultFontSize="12px">
                    <input
                      type="text"
                      value={sq.marks}
                      onChange={(e) => updateSubQuestion(question.id, sq.id, 'marks', e.target.value)}
                      className="w-6 text-center bg-transparent border-none focus:outline-none px-1 placeholder-gray-400"
                      placeholder="m"
                    />
                  </SelectableElement>
                  <span className="text-gray-400 no-print">]</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {isActive && !isGeneratingPdf && (
          <div className="pl-12 no-print text-xs text-blue-500 mb-2">
            Currently editing this set. Use the + button to add questions inside it.
          </div>
        )}
      </div>
    </div>
  );
}
