'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ContextMenuItem {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
}

interface MenuState {
    x: number;
    y: number;
    items: ContextMenuItem[];
}

interface ContextMenuContextValue {
    menuState: MenuState | null;
    openMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
    closeMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextValue>({
    menuState: null,
    openMenu: () => { },
    closeMenu: () => { },
});

export function ContextMenuProvider({ children }: { children: ReactNode }) {
    const [menuState, setMenuState] = useState<MenuState | null>(null);

    const openMenu = useCallback((x: number, y: number, items: ContextMenuItem[]) => {
        setMenuState({ x, y, items });
    }, []);

    const closeMenu = useCallback(() => {
        setMenuState(null);
    }, []);

    return (
        <ContextMenuContext.Provider value={{ menuState, openMenu, closeMenu }}>
            {children}
        </ContextMenuContext.Provider>
    );
}

export function useContextMenu() {
    return useContext(ContextMenuContext);
}
