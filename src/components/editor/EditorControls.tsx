'use client';

import { useState } from 'react';
import { Plus, X, PlusCircle, Divide } from 'lucide-react';
import { useDocumentStore } from '@/store/documentStore';

interface Props {
  pageIndex: number;
  compact?: boolean;
}

export function EditorControls({ pageIndex, compact = false }: Props) {
  const [showDropdown, setShowDropdown] = useState(false);
  const {
    activeInstructionId,
    addInstruction,
    addTable,
    addSubQuestion,
    addFractionToInstruction,
    setActiveInstruction
  } = useDocumentStore();

  return (
    <div className={`relative flex justify-center no-print w-full z-10 ${compact ? 'mt-0' : 'mt-8'}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`bg-black text-white ${compact ? 'p-2' : 'p-3 md:p-4'} rounded-full hover:bg-gray-800 transition-all shadow-lg ${showDropdown ? 'rotate-45' : ''
          }`}
      >
        <Plus size={compact ? 18 : 24} />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute bottom-full mb-3 md:mb-2 bg-white border border-gray-200 rounded-lg shadow-2xl py-2 w-56 z-20 overflow-hidden">
          {!activeInstructionId ? (
            <>
              <button
                onClick={() => {
                  addInstruction(pageIndex);
                  setShowDropdown(false);
                }}
                className="w-full text-left px-5 py-3 text-black hover:bg-gray-100 transition-colors flex items-center gap-3 active:bg-gray-200"
              >
                <PlusCircle size={18} /> Add Instruction
              </button>
              <button
                onClick={() => {
                  addTable(pageIndex);
                  setShowDropdown(false);
                }}
                className="w-full text-left px-5 py-3 text-black hover:bg-gray-100 transition-colors flex items-center gap-3 active:bg-gray-200"
              >
                <PlusCircle size={18} /> Add Table
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  addSubQuestion(activeInstructionId);
                  setShowDropdown(false);
                }}
                className="w-full text-left px-5 py-3 text-black hover:bg-gray-100 transition-colors flex items-center gap-3 active:bg-gray-200"
              >
                <PlusCircle size={18} /> Add Question
              </button>
              <button
                onClick={() => {
                  addFractionToInstruction(activeInstructionId);
                  setShowDropdown(false);
                }}
                className="w-full text-left px-5 py-3 text-black hover:bg-gray-100 transition-colors flex items-center gap-3 active:bg-gray-200"
              >
                <Divide size={18} /> Add Fraction
              </button>
              <button
                onClick={() => {
                  setActiveInstruction(null);
                  setShowDropdown(false);
                }}
                className="w-full text-left px-5 py-3 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 border-t border-gray-100 active:bg-red-100"
              >
                <X size={18} /> Exit Question Set
              </button>
            </>
          )}
        </div>
      )}

      {/* Click outside to close dropdown area */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
