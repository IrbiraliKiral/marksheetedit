'use client';

import { useRef } from 'react';
import { X } from 'lucide-react';
import { InstructionQuestion, InlineSegment } from '@/types';
import { useDocumentStore } from '@/store/documentStore';
import { SelectableElement } from '../editor/SelectableElement';

interface Props {
  question: InstructionQuestion;
  isActive: boolean;
  isGeneratingPdf: boolean;
}

// Auto-sizes an inline text input to its content
function AutoInput({
  value,
  placeholder,
  onChange,
  className,
  style,
}: {
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  // Minimum width keeps empty inputs clickable
  const width = Math.max(value.length * 7.5 + 4, placeholder ? placeholder.length * 6 + 4 : 20);
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-transparent border-none focus:outline-none placeholder-gray-400 ${className ?? ''}`}
      style={{ width: `${width}px`, ...style }}
    />
  );
}

// Renders the content array inline (text + fraction segments)
function InlineContent({
  segments,
  onUpdateSegment,
  onRemoveSegment,
  isGeneratingPdf,
}: {
  segments: InlineSegment[];
  onUpdateSegment: (segmentId: string, field: 'value' | 'numerator' | 'denominator', value: string) => void;
  onRemoveSegment: (segmentId: string) => void;
  isGeneratingPdf: boolean;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-0.5">
      {segments.map((seg) => {
        if (seg.type === 'text') {
          return (
            <AutoInput
              key={seg.id}
              value={seg.value}
              placeholder="…"
              onChange={(v) => onUpdateSegment(seg.id, 'value', v)}
              style={{ fontSize: 'inherit', lineHeight: 'inherit', verticalAlign: 'middle' }}
            />
          );
        }

        // Fraction segment
        return (
          <span
            key={seg.id}
            className="relative inline-flex flex-col items-center mx-1 group/frac"
            style={{ verticalAlign: 'middle' }}
          >
            {/* Delete button — hidden during PDF generation */}
            {!isGeneratingPdf && (
              <button
                onClick={() => onRemoveSegment(seg.id)}
                className="absolute -top-2.5 -right-2.5 bg-red-500 text-white rounded-full p-px opacity-0 group-hover/frac:opacity-100 transition-opacity z-10 no-print"
                title="Remove fraction"
              >
                <X size={9} />
              </button>
            )}
            {/* Numerator */}
            <AutoInput
              value={seg.numerator}
              placeholder="a"
              onChange={(v) => onUpdateSegment(seg.id, 'numerator', v)}
              className="text-center"
              style={{ fontSize: 'inherit', lineHeight: '1.3' }}
            />
            {/* Bar */}
            <span className="block border-t border-current" style={{ minWidth: '1.5rem', width: '100%' }} />
            {/* Denominator */}
            <AutoInput
              value={seg.denominator}
              placeholder="b"
              onChange={(v) => onUpdateSegment(seg.id, 'denominator', v)}
              className="text-center"
              style={{ fontSize: 'inherit', lineHeight: '1.3' }}
            />
          </span>
        );
      })}
    </span>
  );
}

export function InstructionBlock({ question, isActive, isGeneratingPdf }: Props) {
  const {
    updateInstruction,
    updateSubQuestion,
    updateInstructionSegment,
    updateSubQuestionSegment,
    removeInstructionSegment,
    removeSubQuestionSegment,
  } = useDocumentStore();

  const handleResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  // Determine whether the instruction uses rich inline content or plain text
  const hasRichContent = question.content && question.content.length > 0;

  return (
    <div className="relative">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          {/* Serial number */}
          <SelectableElement id={`inst-serial-${question.id}`} type="text" defaultFontSize="12px">
            <input
              type="text"
              value={question.serialNumber}
              onChange={(e) => updateInstruction(question.id, 'serialNumber', e.target.value)}
              className="w-10 text-left bg-transparent border-none focus:outline-none px-1 placeholder-gray-400"
              placeholder="Q."
            />
          </SelectableElement>

          {/* Instruction text / inline segments */}
          <SelectableElement id={`inst-text-${question.id}`} type="text" defaultFontSize="12px" className="flex-1">
            {hasRichContent ? (
              <div className="w-full px-1 min-h-[24px] flex flex-wrap items-center">
                <InlineContent
                  segments={question.content!}
                  onUpdateSegment={(segId, field, value) =>
                    updateInstructionSegment(question.id, segId, field, value)
                  }
                  onRemoveSegment={(segId) => removeInstructionSegment(question.id, segId)}
                  isGeneratingPdf={isGeneratingPdf}
                />
              </div>
            ) : (
              <textarea
                value={question.instruction}
                onChange={(e) => updateInstruction(question.id, 'instruction', e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none px-1 resize-none overflow-hidden placeholder-gray-400 block"
                placeholder="Write your instruction here..."
                style={{ minHeight: '24px' }}
                onInput={handleResize}
              />
            )}
          </SelectableElement>

          {/* Marks */}
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
            {question.subQuestions.map(sq => {
              const sqHasRich = sq.content && sq.content.length > 0;
              return (
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
                    {sqHasRich ? (
                      <div className="w-full px-1 min-h-[24px] flex flex-wrap items-center">
                        <InlineContent
                          segments={sq.content!}
                          onUpdateSegment={(segId, field, value) =>
                            updateSubQuestionSegment(question.id, sq.id, segId, field, value)
                          }
                          onRemoveSegment={(segId) => removeSubQuestionSegment(question.id, sq.id, segId)}
                          isGeneratingPdf={isGeneratingPdf}
                        />
                      </div>
                    ) : (
                      <textarea
                        value={sq.instruction}
                        onChange={(e) => updateSubQuestion(question.id, sq.id, 'instruction', e.target.value)}
                        className="w-full bg-transparent border-none focus:outline-none px-1 resize-none overflow-hidden placeholder-gray-400 block"
                        placeholder="Write question here..."
                        style={{ minHeight: '24px' }}
                        onInput={handleResize}
                      />
                    )}
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
              );
            })}
          </div>
        )}

        {isActive && !isGeneratingPdf && (
          <div className="pl-12 no-print text-xs text-blue-500 mb-2">
            Currently editing this set. Use the + button to add questions or fractions inside it.
          </div>
        )}
      </div>
    </div>
  );
}
