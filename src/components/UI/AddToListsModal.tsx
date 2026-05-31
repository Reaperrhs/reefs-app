import React, { useState } from 'react';
import { useSavedReefs } from '../../hooks/useSavedReefs';
import type { ReefFeature } from '../../types/reef';
import { X, Check } from 'lucide-react';

interface AddToListsModalProps {
    isOpen: boolean;
    onClose: () => void;
    reefs: ReefFeature[];
}

export const AddToListsModal: React.FC<AddToListsModalProps> = ({ isOpen, onClose, reefs }) => {
    const { lists, addReefsToList, removeReefFromList, createList } = useSavedReefs();
    const [newListName, setNewListName] = useState('');

    if (!isOpen || reefs.length === 0) return null;

    // Get all valid IDs
    const reefIds = reefs.map(r => r.properties.ObjectId || r.properties.OBJECTID).filter((id): id is number => !!id);

    if (reefIds.length === 0) return null;

    const handleToggle = (listId: string, isFullyIncluded: boolean) => {
        if (isFullyIncluded) {
            // If all selected reefs are in the list, remove them all
            reefIds.forEach(id => removeReefFromList(listId, id));
        } else {
            // Otherwise, add all missing ones
            addReefsToList(listId, reefIds);
        }
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newListName.trim()) {
            // Auto-add the current reefs to the new list
            createList(newListName.trim(), reefIds);
            setNewListName('');
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
            <div className="w-full max-w-md bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-lg font-bold text-white">Save to List</h2>
                        <p className="text-xs text-cyan-400 font-medium mt-0.5 max-w-[280px] truncate">
                            {reefs.length === 1 ? `Spot: ${reefs[0].properties.Name}` : `Selected: ${reefs.length} spots`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {lists.map(list => {
                        // Check if ALL selected reefs are in this list
                        const isFullyIncluded = reefIds.every(id => list.reefIds.includes(id));
                        // Check if SOME are included
                        const isPartiallyIncluded = !isFullyIncluded && reefIds.some(id => list.reefIds.includes(id));

                        return (
                            <div
                                key={list.id}
                                onClick={() => handleToggle(list.id, isFullyIncluded)}
                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isFullyIncluded ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isFullyIncluded ? 'bg-cyan-500 border-cyan-500' : isPartiallyIncluded ? 'bg-transparent border-cyan-500' : 'border-slate-500'}`}>
                                        {isFullyIncluded && <Check size={14} className="text-black" />}
                                        {isPartiallyIncluded && <div className="w-2 h-2 bg-cyan-500 rounded-sm" />}
                                    </div>
                                    <span className={`font-medium ${isFullyIncluded ? 'text-white' : 'text-slate-300'}`}>{list.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isFullyIncluded && (
                                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 animate-pulse shrink-0">
                                            Saved
                                        </span>
                                    )}
                                    <span className="text-xs text-slate-500">{list.reefIds.length} spots</span>
                                </div>
                            </div>
                        );
                    })}

                    <form onSubmit={handleCreate} className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                        <input
                            type="text"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            placeholder="+ Create new list..."
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!newListName.trim()}
                            className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed font-medium px-3 rounded-xl text-sm transition-colors"
                        >
                            Create
                        </button>
                    </form>
                </div>

                <div className="p-4 border-t border-white/10 bg-white/5 text-center">
                    <button onClick={onClose} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 rounded-xl transition-colors">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
