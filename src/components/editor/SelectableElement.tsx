'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';

interface SelectableElementProps {
  id: string;
  type?: string;
  children: React.ReactNode;
  className?: string;
  defaultFontSize?: string;
  defaultDraggable?: boolean;
}

export function SelectableElement({
  id,
  type = 'text',
  children,
  className = '',
  defaultFontSize = '15px',
  defaultDraggable = false
}: SelectableElementProps) {
  const { docState, selectedElementId, setSelectedElement, updateElementConfig } = useDocumentStore();
  const elementRef = useRef<HTMLDivElement>(null);

  const elementConfigs = docState.elementConfigs || {};
  const config = elementConfigs[id] || { id, type, isDraggable: defaultDraggable, fontSize: defaultFontSize, x: 0, y: 0 };

  const isSelected = selectedElementId === id;
  const isDraggable = config.isDraggable;

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pos, setPos] = useState({ x: config.x || 0, y: config.y || 0 });

  // Update local position if config changes externally (or initialization)
  useEffect(() => {
    if (config.x !== pos.x || config.y !== pos.y) {
      setPos({ x: config.x || 0, y: config.y || 0 });
    }
  }, [config.x, config.y]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only select if not already selected to allow clicking inside inputs
    if (!isSelected) {
      setSelectedElement(id);
      e.stopPropagation();
    }

    if (isDraggable) {
      // 0 is left click for mouse, or a single touch point
      setIsDragging(true);
      setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && isDraggable) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPos({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      updateElementConfig(id, { x: pos.x, y: pos.y });
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const style: React.CSSProperties = {
    fontSize: config.fontSize || defaultFontSize,
  };

  if (isDraggable) {
    style.position = 'relative'; // Change from absolute to relative to keep it in flow if not deeply moved, or absolute if you want it completely free-floating. Relative is safer for layout.
    style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    style.zIndex = isSelected ? 40 : 10;
    style.cursor = isDragging ? 'grabbing' : 'grab';
  } else {
    style.cursor = 'pointer';
  }

  // Handle click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isSelected && elementRef.current && !elementRef.current.contains(e.target as Node)) {
        // We don't deselect here because the user might be clicking the ConfigPanel
        // The editor root or specific backdrop should handle global deselection
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSelected]);

  const isEfficientMode = docState.settings?.efficientMode;

  const getContainerClasses = () => {
    if (isEfficientMode) {
      return `relative inline-block ${className} ${isSelected ? 'border-b-2 border-gray-400 -mb-[2px] transition-colors' : 'hover:border-b-2 hover:border-gray-200 -mb-[2px] transition-colors'} touch-none`;
    }
    return `relative inline-block ${className} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent rounded outline-none shadow-[0_0_0_4px_rgba(59,130,246,0.1)]' : 'hover:ring-1 hover:ring-blue-300 hover:ring-offset-1 rounded transition-shadow'} touch-none`;
  };

  return (
    <div
      ref={elementRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={getContainerClasses()}
      style={style}
    >
      {children}

      {isSelected && !isEfficientMode && (
        <div className="absolute -top-3 -right-3 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full no-print shadow-sm pointer-events-none z-10">
          {isDraggable ? 'Unlocked' : 'Selected'}
        </div>
      )}
    </div>
  );
}
