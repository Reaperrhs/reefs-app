import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { ReefFeature, ReefList } from '../types/reef';

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
    // Auth additions
    user: { email: string } | null;
    login: (email: string) => void;
    register: (email: string) => void;
    logout: () => void;
}

const SavedReefsContext = createContext<SavedReefsContextType | undefined>(undefined);

export function SavedReefsProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<{ email: string } | null>(() => {
        const savedUser = localStorage.getItem('reefUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const getStorageKey = (currentUser: typeof user) => {
        return currentUser ? `reefLists_user_${currentUser.email}` : 'reefLists_guest';
    };

    const loadLists = (currentUser: typeof user) => {
        const key = getStorageKey(currentUser);
        const storage = currentUser ? localStorage : sessionStorage;
        const saved = storage.getItem(key);
        if (saved) {
            return JSON.parse(saved);
        }

        // Migration: If registering/logging in, check if guest had lists in sessionStorage
        if (currentUser) {
            const guestSaved = sessionStorage.getItem('reefLists_guest');
            if (guestSaved) {
                try {
                    const guestLists = JSON.parse(guestSaved);
                    if (Array.isArray(guestLists) && guestLists.some(l => l.reefIds.length > 0)) {
                        storage.setItem(key, guestSaved);
                        sessionStorage.removeItem('reefLists_guest');
                        return guestLists;
                    }
                } catch (e) {
                    console.error('Guest migration error', e);
                }
            }

            // Fallback: Check global legacy list
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
                    console.error('Legacy migration failed', e);
                }
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
    };

    const [lists, setLists] = useState<ReefList[]>(() => loadLists(user));

    // When user state changes, reload corresponding lists
    useEffect(() => {
        setLists(loadLists(user));
    }, [user]);

    // Save lists to corresponding storage when lists or user change
    useEffect(() => {
        const key = getStorageKey(user);
        const storage = user ? localStorage : sessionStorage;
        storage.setItem(key, JSON.stringify(lists));
    }, [lists, user]);

    // Auth functions
    const login = (email: string) => {
        const newUser = { email };
        localStorage.setItem('reefUser', JSON.stringify(newUser));
        setUser(newUser);
    };

    const register = (email: string) => {
        const newUser = { email };
        localStorage.setItem('reefUser', JSON.stringify(newUser));
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem('reefUser');
        setUser(null);
    };

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
        const defaultList = lists.find(l => l.id === 'default');
        if (defaultList?.reefIds.includes(reefId)) {
            removeReefFromList('default', reefId);
        } else {
            addReefToList('default', reefId);
        }
    };

    const isSaved = (reefId: number) => {
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
        },
        user,
        login,
        register,
        logout
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
