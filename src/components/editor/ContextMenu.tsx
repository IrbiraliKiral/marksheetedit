'use client';

import { useEffect, useRef } from 'react';
import { useContextMenu } from '@/context/ContextMenuContext';

export function ContextMenu() {
    const { menuState, closeMenu } = useContextMenu();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuState) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeMenu();
        };
        const handleMouseDown = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                closeMenu();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleMouseDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, [menuState, closeMenu]);

    if (!menuState) return null;

    // Clamp to viewport so menu never goes off-screen
    const vw = typeof window !== 'undefined' ? window.innerWidth : 800;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 600;
    const menuW = 192;
    const menuH = menuState.items.length * 44;
    const x = Math.min(menuState.x, vw - menuW - 8);
    const y = Math.min(menuState.y, vh - menuH - 8);

    return (
        <div
            ref={menuRef}
            className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-2xl py-1.5 overflow-hidden no-print"
            style={{ left: x, top: y, minWidth: menuW }}
        >
            {menuState.items.map((item, i) => (
                <button
                    key={i}
                    onClick={() => { item.onClick(); closeMenu(); }}
                    disabled={item.disabled}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${item.danger
                            ? 'text-red-600 hover:bg-red-50 active:bg-red-100'
                            : 'text-gray-800 hover:bg-gray-100 active:bg-gray-200'
                        }`}
                >
                    {item.icon}
                    {item.label}
                </button>
            ))}
        </div>
    );
}
