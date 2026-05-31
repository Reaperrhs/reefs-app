import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { ReefFeature, ReefList } from '../types/reef';

const STORAGE_KEY_LISTS = 'reefLists';
const STORAGE_KEY_LEGACY = 'savedReefs';

interface SavedReefsContextType {
    lists: ReefList[];
    createList: (name: string, initialReefIds?: number[]) => void;
    deleteList: (listId: string) => void;
    renameList: (listId: string, newName: string) => void;
    addReefToList: (listId: string, reefId: number) => void;
    removeReefFromList: (listId: string, reefId: number) => void;
    toggleSaved: (reefId: number) => void;
    isSaved: (reefId: number) => boolean;
    getSavedReefsInList: (listId: string, allReefs: ReefFeature[]) => ReefFeature[];
    addReefsToList: (listId: string, reefIds: number[]) => void;
}

const SavedReefsContext = createContext<SavedReefsContextType | undefined>(undefined);

export function SavedReefsProvider({ children }: { children: ReactNode }) {
    const [lists, setLists] = useState<ReefList[]>(() => {
        // Load lists
        const savedListsJson = localStorage.getItem(STORAGE_KEY_LISTS);
        if (savedListsJson) {
            return JSON.parse(savedListsJson);
        }

        // Migration: Check for legacy saved reefs
        const legacySaved = localStorage.getItem(STORAGE_KEY_LEGACY);
        if (legacySaved) {
            try {
                const ids = JSON.parse(legacySaved);
                if (Array.isArray(ids)) {
                    const defaultList: ReefList = {
                        id: 'default',
                        name: 'Favorites',
                        reefIds: ids,
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    };
                    return [defaultList];
                }
            } catch (e) {
                console.error('Migration failed', e);
            }
        }

        // Default empty state
        return [{
            id: 'default',
            name: 'Favorites',
            reefIds: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        }];
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_LISTS, JSON.stringify(lists));
    }, [lists]);

    // List Management
    const createList = (name: string, initialReefIds: number[] = []) => {
        const newList: ReefList = {
            id: crypto.randomUUID(),
            name,
            reefIds: initialReefIds,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        setLists(prev => [...prev, newList]);
    };

    const deleteList = (listId: string) => {
        if (listId === 'default') return; // Cannot delete default list
        setLists(prev => prev.filter(l => l.id !== listId));
    };

    const renameList = (listId: string, newName: string) => {
        setLists(prev => prev.map(l =>
            l.id === listId ? { ...l, name: newName, updatedAt: Date.now() } : l
        ));
    };

    // Reef Management within Lists
    const addReefToList = (listId: string, reefId: number) => {
        setLists(prev => prev.map(l => {
            if (l.id === listId && !l.reefIds.includes(reefId)) {
                return { ...l, reefIds: [...l.reefIds, reefId].sort((a, b) => a - b), updatedAt: Date.now() };
            }
            return l;
        }));
    };

    const removeReefFromList = (listId: string, reefId: number) => {
        setLists(prev => prev.map(l => {
            if (l.id === listId) {
                return { ...l, reefIds: l.reefIds.filter(id => id !== reefId), updatedAt: Date.now() };
            }
            return l;
        }));
    };

    // Legacy/Compatibility helpers
    const toggleSaved = (reefId: number) => {
        // Toggles in 'default' list for backward compatibility with Heart icon
        const defaultList = lists.find(l => l.id === 'default');
        if (defaultList?.reefIds.includes(reefId)) {
            removeReefFromList('default', reefId);
        } else {
            addReefToList('default', reefId);
        }
    };

    const isSaved = (reefId: number) => {
        // Checks if it's in the default list (for Map Heart Icon)
        return lists.find(l => l.id === 'default')?.reefIds.includes(reefId) || false;
    };

    const getSavedReefsInList = (listId: string, allReefs: ReefFeature[]) => {
        const list = lists.find(l => l.id === listId);
        if (!list) return [];
        const idsSet = new Set(list.reefIds);
        return allReefs.filter(r => {
            const id = r.properties.ObjectId || r.properties.OBJECTID;
            return id ? idsSet.has(id) : false;
        });
    };

    const value = {
        lists,
        createList,
        deleteList,
        renameList,
        addReefToList,
        removeReefFromList,
        toggleSaved,
        isSaved,
        getSavedReefsInList,
        addReefsToList: (listId: string, reefIds: number[]) => {
            setLists(prev => prev.map(l => {
                if (l.id === listId) {
                    const newIds = [...new Set([...l.reefIds, ...reefIds])].sort((a, b) => a - b);
                    return { ...l, reefIds: newIds, updatedAt: Date.now() };
                }
                return l;
            }));
        }
    };

    return (
        <SavedReefsContext.Provider value={value} >
            {children}
        </SavedReefsContext.Provider>
    );
}

export function useSavedReefs() {
    const context = useContext(SavedReefsContext);
    if (context === undefined) {
        throw new Error('useSavedReefs must be used within a SavedReefsProvider');
    }
    return context;
}
