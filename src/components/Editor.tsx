import { useState, useRef, useEffect, useMemo } from 'react';
import { Download, Settings as SettingsIcon, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { useDocumentStore } from '@/store/documentStore';
import { DocumentHeader } from '@/components/editor/DocumentHeader';
import { InstructionBlock } from '@/components/questions/InstructionBlock';
import { TableBlock } from '@/components/questions/TableBlock';
import { EditorControls } from '@/components/editor/EditorControls';
import { ConfigPanel } from '@/components/editor/ConfigPanel';
import { SettingsSidebar } from '@/components/editor/SettingsSidebar';

export default function Editor() {
  const { docState, activeInstructionId, setSelectedElement } = useDocumentStore();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const touchStartDistRef = useRef<number | null>(null);
  const scaleRef = useRef(scale);

  // Keep scaleRef in sync with scale state
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // Handle pinch to zoom
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        touchStartDistRef.current = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStartDistRef.current !== null) {
        e.preventDefault(); // Prevent default browser zoom

        const dist = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );

        const scaleChange = dist / touchStartDistRef.current;

        setScale(prevScale => {
          let newScale = prevScale * scaleChange;
          if (newScale < 0.3) newScale = 0.3;
          if (newScale > 3) newScale = 3;
          return newScale;
        });

        // Update baseline for the next move event
        touchStartDistRef.current = dist;
      }
    };

    const handleTouchEnd = () => {
      touchStartDistRef.current = null;
    };

    // Add event listeners with non-passive to allow preventDefault
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    // Initial scale based on screen size for small devices
    if (window.innerWidth <= 850) {
      document.documentElement.style.setProperty('--pdf-scale', '1');

      if (window.innerWidth <= 400) setScale(0.4);
      else if (window.innerWidth <= 500) setScale(0.45);
      else if (window.innerWidth <= 650) setScale(0.6);
      else setScale(0.8);
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []); // Run once — refs give handlers live access without re-registration


  // Derive the maximum page index from existing questions. Starts at 0.
  const maxPageIndex = useMemo(() => {
    let max = 0;
    for (const q of docState.questions) {
      if (q.pageIndex > max) max = q.pageIndex;
    }
    return max;
  }, [docState.questions]);

  // Keep track of total pages (ensuring there's always an empty one at the end if needed)
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setTotalPages(maxPageIndex + 1);
  }, [maxPageIndex]);

  const addPage = () => {
    setTotalPages(prev => prev + 1);
  };

  const generatePDF = async () => {
    if (!containerRef.current) return;

    setIsGeneratingPdf(true);

    try {
      // Small delay to allow react to render the 'isGeneratingPdf' state (hiding no-print elements)
      await new Promise(resolve => setTimeout(resolve, 100));

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageElements = containerRef.current.querySelectorAll('.pdf-page');

      // Filter out totally empty pages to skip them
      const pagesToPrint = Array.from(pageElements).filter((pageElement, index) => {
        // Page 0 (first page) is never empty due to headers
        if (index === 0) return true;

        // Check if other pages have any questions
        const hasQuestions = docState.questions.some(q => q.pageIndex === index);
        return hasQuestions;
      });

      for (let i = 0; i < pagesToPrint.length; i++) {
        const element = pagesToPrint[i] as HTMLElement;

        // Temporarily store original styles to restore later
        const originalTransition = element.style.transition;
        const originalBoxShadow = element.style.boxShadow;
        const originalBorderRadius = element.style.borderRadius;
        element.style.transition = 'none'; // Disable animations for screenshot
        element.style.boxShadow = 'none'; // Force no box shadow on main container
        element.style.borderRadius = '0'; // Flat for print

        // Disable any input elements from having focus while capturing
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
          activeElement.blur();
        }

        // Strip placeholder attributes from all inputs/textareas so empty fields
        // render as truly blank (html-to-image captures placeholder text otherwise)
        const inputsAndTextareas = Array.from(
          element.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')
        );
        const savedPlaceholders = inputsAndTextareas.map(el => el.getAttribute('placeholder'));
        inputsAndTextareas.forEach(el => el.removeAttribute('placeholder'));

        const dataUrl = await toPng(element, {
          quality: 1,
          backgroundColor: '#ffffff',
          pixelRatio: 2,
          skipFonts: true, // Specifically skips problematic font embedding logic in html-to-image
          fontEmbedCSS: '', // Double measure to ensure it doesn't fail on fonts
          cacheBust: true, // Prevent cached assets from breaking rendering
          filter: (node: any) => {
            // Additional layer of safety to ensure UI/ReactDevTools don't interfere
            if (node.tagName === 'IFRAME') return false;
            if (node.tagName === 'LINK') return false; // Prevent trying to fetch external styles/fonts inline
            if (node.tagName === 'STYLE') return false;

            // Must safely cast or check properties since some nodes might not be HTMLElements (e.g., SVG, Text nodes)
            if (node.nodeType !== 1) return true; // 1 === ELEMENT_NODE

            const htmlNode = node as HTMLElement;

            // Hide controls completely during rendering
            if (htmlNode.classList && htmlNode.classList.contains('no-print')) return false;

            // Clean up styling artifacts directly
            if (htmlNode.style) {
              htmlNode.style.boxShadow = 'none';
            }
            if (htmlNode.classList && htmlNode.classList.contains('ring-2')) {
              htmlNode.classList.remove('ring-2', 'ring-gray-200', 'bg-gray-50');
              htmlNode.style.backgroundColor = 'transparent';
            }
            // Remove efficient-mode border-b selection/hover indicators from SelectableElement wrappers
            if (htmlNode.classList && (htmlNode.classList.contains('border-b-2') || htmlNode.classList.contains('hover:border-b-2'))) {
              htmlNode.classList.remove('border-b-2', 'border-gray-400', 'hover:border-b-2', 'hover:border-gray-200', '-mb-[2px]');
              htmlNode.style.borderBottom = 'none';
              htmlNode.style.marginBottom = '0';
            }
            // Remove any ring/outline selection styling
            if (htmlNode.classList && (htmlNode.classList.contains('ring-blue-500') || htmlNode.classList.contains('ring-1') || htmlNode.classList.contains('ring-offset-2'))) {
              htmlNode.classList.remove('ring-1', 'ring-blue-500', 'ring-offset-2', 'ring-offset-transparent', 'ring-blue-300');
              htmlNode.style.outline = 'none';
            }
            if (htmlNode.tagName === 'TH' || htmlNode.tagName === 'TD') {
              htmlNode.style.backgroundColor = 'transparent';
            }
            if (htmlNode.classList && htmlNode.classList.contains('bg-gray-50')) {
              htmlNode.style.backgroundColor = 'transparent';
            }

            return true;
          },
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
            width: element.offsetWidth + 'px',
            height: element.offsetHeight + 'px',
            margin: '0',
            boxShadow: 'none',
          }
        });

        // Restore original styles
        element.style.transition = originalTransition;
        element.style.boxShadow = originalBoxShadow;
        element.style.borderRadius = originalBorderRadius;

        // Restore placeholder attributes
        inputsAndTextareas.forEach((el, idx) => {
          const ph = savedPlaceholders[idx];
          if (ph !== null) el.setAttribute('placeholder', ph);
        });

        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save('question-sheet.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the background container (not on elements inside)
    if (e.target === e.currentTarget) {
      setSelectedElement(null);
    }
  };

  const handleZoomIn = () => setScale(s => Math.min(3, s + 0.1));
  const handleZoomOut = () => setScale(s => Math.max(0.3, s - 0.1));
  const handleResetZoom = () => {
    if (window.innerWidth <= 400) setScale(0.4);
    else if (window.innerWidth <= 500) setScale(0.45);
    else if (window.innerWidth <= 650) setScale(0.6);
    else if (window.innerWidth <= 850) setScale(0.8);
    else setScale(1);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center font-sans w-full" onClick={handleBackgroundClick}>
      {/* App Header */}
      <div className="w-full max-w-[800px] flex justify-between items-center mb-6 md:mb-8" onClick={(e) => e.stopPropagation()}>
        <h1 className="text-xl md:text-2xl font-bold truncate pr-4">Question Sheet</h1>
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Zoom Controls for Mobile */}
          <div className="hidden max-[850px]:flex items-center gap-1 bg-gray-900 rounded-lg p-1 mr-2 border border-gray-800">
            <button onClick={handleZoomOut} className="p-1.5 hover:bg-gray-800 rounded transition-colors text-gray-300" title="Zoom Out">
              <ZoomOut size={16} />
            </button>
            <button onClick={handleResetZoom} className="p-1.5 hover:bg-gray-800 rounded transition-colors text-gray-300 text-xs font-semibold w-10 text-center" title="Reset Zoom">
              {Math.round(scale * 100)}%
            </button>
            <button onClick={handleZoomIn} className="p-1.5 hover:bg-gray-800 rounded transition-colors text-gray-300" title="Zoom In">
              <ZoomIn size={16} />
            </button>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 md:p-2.5 rounded hover:bg-gray-800 transition-colors shrink-0 hidden"
            title="Settings"
          >
            <SettingsIcon size={20} />
          </button>

          {/* Question Gap Quick Control */}
          <div className="flex items-center gap-2 bg-gray-900 rounded-lg p-1.5 border border-gray-800 shrink-0 relative group">
            <label className="text-xs text-gray-400 font-medium px-1 cursor-pointer">Gap: {docState.settings?.questionGap ?? 8}</label>
            <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="32"
                value={docState.settings?.questionGap ?? 8}
                onChange={(e) => useDocumentStore.getState().updateSettings({ questionGap: parseInt(e.target.value) })}
                className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                title={`Question Gap: ${docState.settings?.questionGap ?? 8}px`}
              />
              <span className="text-xs text-gray-300 w-6 text-right font-medium">
                {docState.settings?.questionGap ?? 8}
              </span>
            </div>
          </div>

          <button
            onClick={generatePDF}
            disabled={isGeneratingPdf}
            className="bg-white text-black px-3 py-2 md:px-4 md:py-2 rounded flex items-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm md:text-base shrink-0"
          >
            <Download size={18} />
            <span className="hidden sm:inline">{isGeneratingPdf ? 'Generating...' : 'Generate PDF'}</span>
            <span className="sm:hidden">{isGeneratingPdf ? 'Wait...' : 'PDF'}</span>
          </button>
        </div>
      </div>

      {/* Pages Container - Wrapper added for horizontal scroll on mobile if needed */}
      <div className="w-full max-w-[100vw] overflow-auto pb-32 hide-scrollbar pdf-container-scroll touch-pan-x touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div
          className="mx-auto flex justify-center"
          style={{
            minWidth: isGeneratingPdf ? '800px' : `${800 * scale}px`,
            width: isGeneratingPdf ? '800px' : `${800 * scale}px`,
            transition: isGeneratingPdf ? 'none' : 'all 0.1s ease-out'
          }}
        >
          <div
            className="flex flex-col items-center"
            style={{
              width: '800px',
              transform: isGeneratingPdf ? 'scale(1)' : `scale(${scale})`,
              transformOrigin: 'top left', // Scale from top left when inside a fixed width container
              transition: isGeneratingPdf ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            <div ref={containerRef} className="flex flex-col gap-6 md:gap-8 items-center w-full pb-[100px]">
              {Array.from({ length: totalPages }).map((_, pageIndex) => (
                <div key={`page-wrapper-${pageIndex}`} className="pdf-page-wrapper flex justify-center w-full">
                  <div
                    key={`page-${pageIndex}`}
                    className={`pdf-page w-[800px] shrink-0 min-h-[1131px] bg-white text-black p-4 sm:p-8 md:p-12 pdf-preview relative flex flex-col mx-auto origin-top ${isGeneratingPdf ? 'pdf-export-mode' : ''
                      }`}
                    style={{
                      color: 'black',
                    }}
                    onClick={(e) => {
                      // Click on the empty white page should also deselect if it isn't an element
                      if (e.target === e.currentTarget) {
                        setSelectedElement(null);
                      }
                    }}
                  >
                    {pageIndex === 0 && <DocumentHeader />}

                    {/* Questions Section for this page */}
                    <div className="flex flex-col flex-grow" style={{ fontSize: '12px', marginTop: pageIndex === 0 ? '1rem' : '0' }}>
                      {docState.questions
                        .filter((q) => q.pageIndex === pageIndex)
                        .map((q) => {
                          if (q.type === 'instruction') {
                            return (
                              <div key={q.id} className="relative group" style={{ marginBottom: `${docState.settings?.questionGap ?? 8}px` }}>
                                <InstructionBlock
                                  question={q}
                                  isActive={activeInstructionId === q.id}
                                  isGeneratingPdf={isGeneratingPdf}
                                />
                              </div>
                            );
                          }

                          if (q.type === 'table') {
                            return (
                              <div key={q.id} className="relative group" style={{ marginBottom: `${docState.settings?.questionGap ?? 8}px` }}>
                                <TableBlock question={q} />
                              </div>
                            );
                          }

                          return null;
                        })}

                      {/* Show controls inline right after the newest question */}
                      {docState.questions.filter(q => q.pageIndex === pageIndex).length > 0 && (
                        <div className="mt-2 mb-4 flex justify-center opacity-40 hover:opacity-100 transition-opacity">
                          <EditorControls pageIndex={pageIndex} compact={true} />
                        </div>
                      )}
                    </div>

                    {/* Always show EditorControls at the bottom of the page if there are no questions */}
                    {docState.questions.filter(q => q.pageIndex === pageIndex).length === 0 && (
                      <div className="mt-auto pt-8 pb-4 opacity-30 hover:opacity-100 transition-opacity">
                        <EditorControls pageIndex={pageIndex} />
                      </div>
                    )}

                    {/* Page Number at the bottom center */}
                    <div className="absolute bottom-4 left-0 w-full flex justify-center text-black font-semibold" style={{ fontSize: '15px' }}>
                      [{pageIndex + 1}]
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-8 flex justify-center w-full">
                {/* Add Page Button */}
                {!isGeneratingPdf && (
                  <button
                    onClick={addPage}
                    className="mb-12 bg-gray-800 text-white px-6 py-3 rounded-full hover:bg-gray-700 transition-colors flex items-center gap-2 font-semibold shadow-lg mx-auto"
                  >
                    <Download className="rotate-180" size={20} /> Add New Page
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfigPanel />
      <SettingsSidebar isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
