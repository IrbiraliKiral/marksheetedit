'use client';

import { useDocumentStore } from '@/store/documentStore';
import { SelectableElement } from './SelectableElement';

export function DocumentHeader() {
  const { docState, updateHeader } = useDocumentStore();

  return (
    <div className="text-center mb-6 flex flex-col gap-2 relative items-center w-full">
      <SelectableElement id="header-schoolName" type="text" defaultFontSize="16px">
        <input
          type="text"
          value={docState.schoolName}
          onChange={(e) => updateHeader('schoolName', e.target.value)}
          className="text-center font-bold w-full bg-transparent border-none focus:outline-none placeholder-gray-400 uppercase tracking-wide min-w-[300px]"
          placeholder="School Name"
        />
      </SelectableElement>

      <SelectableElement id="header-session" type="text" defaultFontSize="15px">
        <input
          type="text"
          value={docState.session}
          onChange={(e) => updateHeader('session', e.target.value)}
          className="text-center font-semibold w-full bg-transparent border-none focus:outline-none placeholder-gray-400 min-w-[300px]"
          placeholder="Session"
        />
      </SelectableElement>

      <SelectableElement id="header-examinationType" type="text" defaultFontSize="15px">
        <input
          type="text"
          value={docState.examinationType}
          onChange={(e) => updateHeader('examinationType', e.target.value)}
          className="text-center font-semibold w-full bg-transparent border-none focus:outline-none placeholder-gray-400 min-w-[300px]"
          placeholder="Type of Examination"
        />
      </SelectableElement>

      <SelectableElement id="header-className" type="text" defaultFontSize="15px" className="w-full max-w-[400px]">
        <input
          type="text"
          value={docState.className}
          onChange={(e) => updateHeader('className', e.target.value)}
          className="text-center w-full bg-transparent border-none focus:outline-none placeholder-gray-400 font-semibold"
          placeholder="Class"
        />
      </SelectableElement>

      <div className="relative w-full flex items-center justify-center mt-1">
        <div className="absolute left-0">
          <SelectableElement id="header-time" type="text" defaultFontSize="15px">
            <input
              type="text"
              value={docState.time}
              onChange={(e) => updateHeader('time', e.target.value)}
              className="text-left w-48 sm:w-64 bg-transparent border-none focus:outline-none placeholder-gray-400 font-semibold"
              placeholder="Time 2 Hours 30 minutes"
            />
          </SelectableElement>
        </div>

        <div className="max-w-[400px] w-full px-4">
          <SelectableElement id="header-subjectName" type="text" defaultFontSize="15px" className="w-full">
            <input
              type="text"
              value={docState.subjectName}
              onChange={(e) => updateHeader('subjectName', e.target.value)}
              className="text-center w-full bg-transparent border-none focus:outline-none placeholder-gray-400 font-bold"
              placeholder="Subject"
            />
          </SelectableElement>
        </div>

        <div className="absolute right-0">
          <SelectableElement id="header-fullMarks" type="text" defaultFontSize="15px">
            <div className="flex items-center justify-end gap-1 font-bold">
              <span className="whitespace-nowrap">Full Marks:</span>
              <input
                type="text"
                value={docState.fullMarks}
                onChange={(e) => updateHeader('fullMarks', e.target.value)}
                className="text-left w-12 bg-transparent border-none focus:outline-none placeholder-gray-400"
                placeholder="100"
              />
            </div>
          </SelectableElement>
        </div>
      </div>
    </div>
  );
}
