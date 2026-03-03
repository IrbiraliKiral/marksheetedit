'use client';

import { useState, useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { Lock, Unlock, X } from 'lucide-react';

export function ConfigPanel() {
  const { selectedElementId, docState, setSelectedElement, updateElementConfig, updateHeader, updateInstruction, updateSubQuestion, updateTableRow } = useDocumentStore();
  const elementConfigs = docState.elementConfigs || {};

  // We need to render the panel even if no element is selected,
  // so the CSS transition works. We'll use a local state to keep
  // the last selected config visible during the slide-out animation.
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedElementId) {
      setActiveId(selectedElementId);
    }
  }, [selectedElementId]);

  const displayId = selectedElementId || activeId;

  const isEfficientMode = docState.settings?.efficientMode;

  if (!displayId || isEfficientMode) return null;

  const config = elementConfigs[displayId] || { id: displayId, type: 'text', isDraggable: false };

  const isHeaderElement = displayId.startsWith('header-');

  // Try to find the content if it's a known element type
  let content = '';
  let contentLabel = 'Text Content';
  let updateContent = (val: string) => {};

  if (isHeaderElement) {
    const field = displayId.replace('header-', '') as keyof typeof docState;
    if (typeof docState[field] === 'string') {
        content = docState[field] as string;
        contentLabel = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        updateContent = (val: string) => updateHeader(field as any, val);
    }
  } else if (displayId.startsWith('inst-text-')) {
    const id = displayId.replace('inst-text-', '');
    const q = docState.questions.find(q => q.id === id);
    if (q && q.type === 'instruction') {
        content = q.instruction;
        updateContent = (val: string) => updateInstruction(id, 'instruction', val);
    }
  } else if (displayId.startsWith('inst-marks-')) {
    const id = displayId.replace('inst-marks-', '');
    const q = docState.questions.find(q => q.id === id);
    if (q && q.type === 'instruction') {
        content = q.marks;
        contentLabel = 'Marks';
        updateContent = (val: string) => updateInstruction(id, 'marks', val);
    }
  } else if (displayId.startsWith('table-cell-')) {
     const parts = displayId.split('-');
     const tableId = parts[2];
     const rowId = parts[3];
     const colName = parts[4] as 'columnA' | 'columnB';
     const t = docState.questions.find(q => q.id === tableId);
     if (t && t.type === 'table') {
        const row = t.rows.find(r => r.id === rowId);
        if (row) {
            content = row[colName];
            updateContent = (val: string) => updateTableRow(tableId, rowId, colName, val);
        }
     }
  } else if (config.content !== undefined) {
    content = config.content;
    updateContent = (val: string) => updateElementConfig(displayId, { content: val });
  }

  const handleDragToggle = () => {
    updateElementConfig(displayId, { isDraggable: !config.isDraggable });
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateElementConfig(displayId, { fontSize: e.target.value + 'px' });
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden no-print transition-opacity duration-300 ${
          selectedElementId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSelectedElement(null)}
      />

      {/* Panel */}
      <div
        className={`fixed bottom-0 left-0 w-full max-h-[80vh] md:max-h-none md:h-full md:top-0 md:left-auto md:right-0 md:w-80 bg-black border-t md:border-t-0 md:border-l border-gray-800 p-4 md:p-6 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-2xl z-50 text-white overflow-y-auto no-print transition-transform duration-300 ease-in-out rounded-t-2xl md:rounded-none ${
          selectedElementId ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg md:text-xl font-bold">Element Config</h2>
          <button onClick={() => setSelectedElement(null)} className="p-2 hover:bg-gray-800 rounded-full transition-colors bg-gray-900 md:bg-transparent">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-5 md:gap-6 pb-8 md:pb-0">
        {/* Unlock / Lock Dragging */}
        <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
            <span className="font-medium">Positioning</span>
            <button
              onClick={handleDragToggle}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-semibold transition-colors ${config.isDraggable ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
            >
              {config.isDraggable ? (
                <><Unlock size={14} /> Unlocked</>
              ) : (
                <><Lock size={14} /> Locked</>
              )}
            </button>
        </div>

        {config.isDraggable && (
             <div className="text-xs text-gray-400 bg-gray-900/50 p-2 rounded">
                 Element is unlocked. You can now drag it around the page.
             </div>
        )}

        {/* Text Content */}
        {content !== undefined && updateContent && (
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">{contentLabel}</label>
                <textarea
                  value={content}
                  onChange={(e) => updateContent(e.target.value)}
                  className="bg-gray-900 border border-gray-800 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-y min-h-[80px]"
                />
            </div>
        )}

        {/* Font Size */}
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Font Size</label>
            <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="8"
                  max="48"
                  value={parseInt(config.fontSize || '15')}
                  onChange={handleFontSizeChange}
                  className="flex-1"
                />
                <span className="text-sm w-12 text-right">{parseInt(config.fontSize || '15')}px</span>
            </div>
        </div>
      </div>
      </div>
    </>
  );
}
