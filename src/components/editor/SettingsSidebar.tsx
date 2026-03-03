'use client';

import { useEffect, useState } from 'react';
import { X, Layout, Monitor } from 'lucide-react';
import { useDocumentStore } from '@/store/documentStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsSidebar({ isOpen, onClose }: Props) {
  const { docState, updateSettings } = useDocumentStore();
  const [activeTab, setActiveTab] = useState<'edit' | 'appearance'>('edit');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Basic mobile detection logic
      setIsMobile(window.innerWidth < 768);
    };

    // Check initially
    checkMobile();

    // Auto-enable efficient mode if on mobile
    if (window.innerWidth < 768 && !docState.settings?.efficientMode) {
      updateSettings({ efficientMode: true });
    }

    // Add resize listener
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []); // Only run once on mount

  const handleEfficientModeToggle = () => {
    // Don't allow toggling if mobile
    if (isMobile) return;

    updateSettings({ efficientMode: !docState.settings?.efficientMode });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-80 bg-black border-l border-gray-800 p-6 flex flex-col shadow-2xl z-50 text-white transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold">Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-800 mb-6 pb-2">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 font-medium transition-colors pb-2 -mb-[9px] ${
              activeTab === 'edit' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Layout size={16} /> Edit View
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 font-medium transition-colors pb-2 -mb-[9px] ${
              activeTab === 'appearance' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Monitor size={16} /> Appearance
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'edit' && (
            <div className="flex flex-col gap-6">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <h3 className="font-semibold text-sm mb-1">Efficient Mode</h3>
                    <p className="text-xs text-gray-400">
                      Disables selection outlines and the config panel for a cleaner editing experience.
                      Uses minimal bottom borders for selection.
                    </p>
                    {isMobile && (
                      <p className="text-xs text-blue-400 mt-2 font-medium">
                        * Required on mobile devices for optimal experience
                      </p>
                    )}
                  </div>

                  {/* Toggle switch */}
                  <button
                    onClick={handleEfficientModeToggle}
                    disabled={isMobile}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black shrink-0 ${
                      docState.settings?.efficientMode ? 'bg-blue-600' : 'bg-gray-700'
                    } ${isMobile ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        docState.settings?.efficientMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="flex flex-col items-center justify-center h-40 text-center text-gray-500 gap-2">
              <Monitor size={32} className="opacity-20" />
              <p className="text-sm">Appearance settings coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
