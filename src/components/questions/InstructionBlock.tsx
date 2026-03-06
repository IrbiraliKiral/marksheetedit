'use client';

import { useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { InstructionQuestion, Fraction } from '@/types';
import { useDocumentStore } from '@/store/documentStore';
import { SelectableElement } from '../editor/SelectableElement';

interface Props {
  question: InstructionQuestion;
  isActive: boolean;
  isGeneratingPdf: boolean;
}

// A single draggable fraction widget
function FractionWidget({
  fraction,
  isGeneratingPdf,
  onUpdate,
  onRemove,
  onDrag,
}: {
  fraction: Fraction;
  isGeneratingPdf: boolean;
  onUpdate: (updates: { numerator?: string; denominator?: string }) => void;
  onRemove: () => void;
  onDrag: (x: number, y: number) => void;
}) {
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't initiate drag if clicking on inputs
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    e.preventDefault();
    e.stopPropagation();
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: fraction.x,
      origY: fraction.y,
    };

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragState.current) return;
      const dx = ev.clientX - dragState.current.startX;
      const dy = ev.clientY - dragState.current.startY;
      onDrag(dragState.current.origX + dx, dragState.current.origY + dy);
    };

    const onMouseUp = () => {
      dragState.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [fraction.x, fraction.y, onDrag]);

  // Touch support
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    const touch = e.touches[0];
    dragState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      origX: fraction.x,
      origY: fraction.y,
    };

    const onTouchMove = (ev: TouchEvent) => {
      if (!dragState.current) return;
      const t = ev.touches[0];
      const dx = t.clientX - dragState.current.startX;
      const dy = t.clientY - dragState.current.startY;
      onDrag(dragState.current.origX + dx, dragState.current.origY + dy);
    };

    const onTouchEnd = () => {
      dragState.current = null;
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
  }, [fraction.x, fraction.y, onDrag]);

  return (
    <span
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      className="absolute inline-flex flex-col items-center group/frac select-none"
      style={{
        left: fraction.x,
        top: fraction.y,
        cursor: 'grab',
        zIndex: 10,
        touchAction: 'none',
      }}
    >
      {!isGeneratingPdf && (
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-2.5 -right-2.5 bg-red-500 text-white rounded-full p-px opacity-0 group-hover/frac:opacity-100 transition-opacity z-10 no-print"
          title="Remove fraction"
        >
          <X size={9} />
        </button>
      )}
      {/* Numerator */}
      <input
        type="text"
        value={fraction.numerator}
        placeholder="a"
        onChange={(e) => onUpdate({ numerator: e.target.value })}
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-transparent border-none focus:outline-none text-center placeholder-gray-400"
        style={{ width: `${Math.max(fraction.numerator.length * 8 + 8, 28)}px`, lineHeight: '1.3', fontSize: 'inherit' }}
      />
      {/* Bar */}
      <span className="block border-t border-current w-full" style={{ minWidth: '1.75rem' }} />
      {/* Denominator */}
      <input
        type="text"
        value={fraction.denominator}
        placeholder="b"
        onChange={(e) => onUpdate({ denominator: e.target.value })}
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-transparent border-none focus:outline-none text-center placeholder-gray-400"
        style={{ width: `${Math.max(fraction.denominator.length * 8 + 8, 28)}px`, lineHeight: '1.3', fontSize: 'inherit' }}
      />
    </span>
  );
}

// A textarea row that tracks cursor pixel position for fraction placement
function QuestionTextarea({
  value,
  placeholder,
  onChange,
  onCursorChange,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  onCursorChange: (x: number, y: number) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const reportCursor = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const containerRect = el.parentElement?.getBoundingClientRect() ?? rect;

    // Use a hidden clone to measure cursor pixel position
    const clone = document.createElement('div');
    const style = window.getComputedStyle(el);
    Array.from(style).forEach((prop) => {
      try { (clone.style as any)[prop] = style.getPropertyValue(prop); } catch { }
    });
    clone.style.position = 'absolute';
    clone.style.visibility = 'hidden';
    clone.style.whiteSpace = 'pre-wrap';
    clone.style.wordBreak = 'break-word';
    clone.style.width = `${el.offsetWidth}px`;
    clone.style.height = 'auto';

    const cursorPos = el.selectionStart ?? el.value.length;
    const textBefore = el.value.slice(0, cursorPos);
    const span = document.createElement('span');
    span.textContent = textBefore || '\u200b';
    const caret = document.createElement('span');
    caret.textContent = '|';
    clone.appendChild(span);
    clone.appendChild(caret);
    document.body.appendChild(clone);

    const cloneRect = clone.getBoundingClientRect();
    const caretRect = caret.getBoundingClientRect();
    document.body.removeChild(clone);

    const x = caretRect.left - rect.left + el.scrollLeft;
    const y = caretRect.top - rect.top + el.scrollTop;
    onCursorChange(Math.max(0, x), Math.max(0, y));
  }, [onCursorChange]);

  const handleResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const t = e.target as HTMLTextAreaElement;
    t.style.height = 'auto';
    t.style.height = `${t.scrollHeight}px`;
  };

  return (
    <textarea
      ref={ref}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent border-none focus:outline-none px-1 resize-none overflow-hidden placeholder-gray-400 block"
      style={{ minHeight: '24px' }}
      onInput={handleResize}
      onFocus={reportCursor}
      onSelect={reportCursor}
      onKeyUp={reportCursor}
      onMouseUp={reportCursor}
    />
  );
}

export function InstructionBlock({ question, isActive, isGeneratingPdf }: Props) {
  const {
    updateInstruction,
    updateSubQuestion,
    updateFraction,
    removeFraction,
    setFocusedField,
  } = useDocumentStore();

  const instContainerRef = useRef<HTMLDivElement>(null);
  const subContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

          {/* Instruction text + fraction overlays */}
          <SelectableElement id={`inst-text-${question.id}`} type="text" defaultFontSize="12px" className="flex-1">
            <div
              ref={instContainerRef}
              className="relative w-full"
            >
              <QuestionTextarea
                value={question.instruction}
                placeholder="Write your instruction here..."
                onChange={(v) => updateInstruction(question.id, 'instruction', v)}
                onCursorChange={(x, y) =>
                  setFocusedField({ kind: 'instruction', instructionId: question.id, x, y })
                }
              />
              {/* Fraction overlays */}
              {(question.fractions ?? []).map(frac => (
                <FractionWidget
                  key={frac.id}
                  fraction={frac}
                  isGeneratingPdf={isGeneratingPdf}
                  onUpdate={(updates) =>
                    updateFraction(question.id, null, frac.id, updates)
                  }
                  onRemove={() => removeFraction(question.id, null, frac.id)}
                  onDrag={(x, y) => updateFraction(question.id, null, frac.id, { x, y })}
                />
              ))}
            </div>
          </SelectableElement>

          {/* Marks */}
          <div className="flex items-center gap-1 w-24">
            <span className="text-gray-400 no-print">[</span>
            <SelectableElement id={`inst-marks-${question.id}`} type="text" defaultFontSize="10px">
              <input
                type="text"
                value={question.marks}
                onChange={(e) => updateInstruction(question.id, 'marks', e.target.value)}
                className="w-16 text-center bg-transparent border-none focus:outline-none px-1 placeholder-gray-400"
                style={{ fontSize: '10px' }}
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
                  <div
                    ref={el => { subContainerRefs.current[sq.id] = el; }}
                    className="relative w-full"
                  >
                    <QuestionTextarea
                      value={sq.instruction}
                      placeholder="Write question here..."
                      onChange={(v) => updateSubQuestion(question.id, sq.id, 'instruction', v)}
                      onCursorChange={(x, y) =>
                        setFocusedField({ kind: 'subQuestion', instructionId: question.id, subQuestionId: sq.id, x, y })
                      }
                    />
                    {/* Fraction overlays */}
                    {(sq.fractions ?? []).map(frac => (
                      <FractionWidget
                        key={frac.id}
                        fraction={frac}
                        isGeneratingPdf={isGeneratingPdf}
                        onUpdate={(updates) =>
                          updateFraction(question.id, sq.id, frac.id, updates)
                        }
                        onRemove={() => removeFraction(question.id, sq.id, frac.id)}
                        onDrag={(x, y) => {
                          updateFraction(question.id, sq.id, frac.id, { x, y });
                        }}
                      />
                    ))}
                  </div>
                </SelectableElement>

                <div className="flex items-center gap-1 w-20">
                  <span className="text-gray-400 no-print">[</span>
                  <SelectableElement id={`sub-marks-${sq.id}`} type="text" defaultFontSize="10px">
                    <input
                      type="text"
                      value={sq.marks}
                      onChange={(e) => updateSubQuestion(question.id, sq.id, 'marks', e.target.value)}
                      className="w-14 text-center bg-transparent border-none focus:outline-none px-1 placeholder-gray-400"
                      style={{ fontSize: '10px' }}
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
            Currently editing this set. Use the + button to add questions or fractions inside it.
          </div>
        )}
      </div>
    </div>
  );
}
