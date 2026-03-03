'use client';

import { Plus } from 'lucide-react';
import { TableQuestion } from '@/types';
import { useDocumentStore } from '@/store/documentStore';
import { SelectableElement } from '../editor/SelectableElement';

interface Props {
  question: TableQuestion;
}

export function TableBlock({ question }: Props) {
  const { updateTableRow, addTableRow } = useDocumentStore();

  return (
    <div className="my-4">
      <table className="w-full border-collapse border border-black" style={{ fontSize: '12px' }}>
        <thead>
          <tr>
            <th className="border border-black p-2 bg-transparent w-1/2">Column A</th>
            <th className="border border-black p-2 bg-transparent w-1/2">Column B</th>
          </tr>
        </thead>
        <tbody>
          {question.rows.map(row => (
            <tr key={row.id}>
              <td className="border border-black p-0">
                <SelectableElement id={`table-cell-${question.id}-${row.id}-columnA`} type="text" defaultFontSize="12px" className="w-full h-full block">
                  <input
                    type="text"
                    value={row.columnA}
                    onChange={(e) => updateTableRow(question.id, row.id, 'columnA', e.target.value)}
                    className="w-full h-full p-2 bg-transparent border-none focus:outline-none placeholder-gray-400"
                    placeholder="Item A"
                  />
                </SelectableElement>
              </td>
              <td className="border border-black p-0">
                <SelectableElement id={`table-cell-${question.id}-${row.id}-columnB`} type="text" defaultFontSize="12px" className="w-full h-full block">
                  <input
                    type="text"
                    value={row.columnB}
                    onChange={(e) => updateTableRow(question.id, row.id, 'columnB', e.target.value)}
                    className="w-full h-full p-2 bg-transparent border-none focus:outline-none placeholder-gray-400"
                    placeholder="Item B"
                  />
                </SelectableElement>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 text-center no-print">
        <button
          onClick={() => addTableRow(question.id)}
          className="text-gray-500 hover:text-black flex items-center justify-center w-full gap-1 p-1 hover:bg-gray-100 rounded text-xs transition-colors"
        >
          <Plus size={12} /> Add Row
        </button>
      </div>
    </div>
  );
}
