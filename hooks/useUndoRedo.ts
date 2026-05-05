import { useState, useCallback, useRef } from 'react';

interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

interface UseUndoRedoReturn<T> {
    state: T;
    setState: (newState: T | ((prev: T) => T), saveToHistory?: boolean) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    clearHistory: () => void;
    historyLength: number;
}

const MAX_HISTORY_LENGTH = 20;

/**
 * Custom hook for Undo/Redo functionality
 * Keeps track of state changes and allows reverting to previous states
 */
export function useUndoRedo<T>(initialState: T): UseUndoRedoReturn<T> {
    const [history, setHistory] = useState<HistoryState<T>>({
        past: [],
        present: initialState,
        future: [],
    });

    // Debounce timer to prevent too many history entries
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastUpdateTime = useRef<number>(0);

    const setState = useCallback((newState: T | ((prev: T) => T), saveToHistory: boolean = true) => {
        setHistory((currentHistory) => {
            const resolvedState = typeof newState === 'function'
                ? (newState as (prev: T) => T)(currentHistory.present)
                : newState;

            // Skip if state is the same
            if (JSON.stringify(resolvedState) === JSON.stringify(currentHistory.present)) {
                return currentHistory;
            }

            if (!saveToHistory) {
                return {
                    ...currentHistory,
                    present: resolvedState,
                };
            }

            // Debounce: only save to history if more than 500ms since last save
            const now = Date.now();
            const shouldSaveToHistory = now - lastUpdateTime.current > 500;
            lastUpdateTime.current = now;

            if (shouldSaveToHistory) {
                const newPast = [...currentHistory.past, currentHistory.present];
                // Limit history length
                const trimmedPast = newPast.slice(-MAX_HISTORY_LENGTH);

                return {
                    past: trimmedPast,
                    present: resolvedState,
                    future: [], // Clear future when new change is made
                };
            } else {
                // Just update present without saving to history (debounced)
                return {
                    ...currentHistory,
                    present: resolvedState,
                };
            }
        });
    }, []);

    const undo = useCallback(() => {
        setHistory((currentHistory) => {
            if (currentHistory.past.length === 0) {
                return currentHistory;
            }

            const previous = currentHistory.past[currentHistory.past.length - 1];
            const newPast = currentHistory.past.slice(0, -1);

            return {
                past: newPast,
                present: previous,
                future: [currentHistory.present, ...currentHistory.future],
            };
        });
    }, []);

    const redo = useCallback(() => {
        setHistory((currentHistory) => {
            if (currentHistory.future.length === 0) {
                return currentHistory;
            }

            const next = currentHistory.future[0];
            const newFuture = currentHistory.future.slice(1);

            return {
                past: [...currentHistory.past, currentHistory.present],
                present: next,
                future: newFuture,
            };
        });
    }, []);

    const clearHistory = useCallback(() => {
        setHistory((currentHistory) => ({
            past: [],
            present: currentHistory.present,
            future: [],
        }));
    }, []);

    return {
        state: history.present,
        setState,
        undo,
        redo,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        clearHistory,
        historyLength: history.past.length,
    };
}
