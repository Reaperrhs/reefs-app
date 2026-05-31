import React, { useState } from 'react';
import { useSavedReefs } from '../../hooks/useSavedReefs';
import type { ReefFeature } from '../../types/reef';
import { exportToGPX, exportToKML, exportToCSV, downloadFile } from '../../utils/files';
import { X, Plus, Trash2, Edit2, Download, FileText, Map as MapIcon, Globe, ChevronDown, ChevronUp, MapPin } from 'lucide-react';

interface ListsManagerProps {
    isOpen: boolean;
    onClose: () => void;
    allReefs: ReefFeature[];
}

export const ListsManager: React.FC<ListsManagerProps> = ({ isOpen, onClose, allReefs }) => {
    const { lists, createList, deleteList, renameList, getSavedReefsInList, removeReefFromList } = useSavedReefs();
    const [newListName, setNewListName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [exportFormat, setExportFormat] = useState<'gpx' | 'kml' | 'csv'>('gpx');
    const [expandedListId, setExpandedListId] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newListName.trim()) {
            createList(newListName.trim());
            setNewListName('');
        }
    };

    const handleRename = (id: string) => {
        if (editName.trim()) {
            renameList(id, editName.trim());
            setEditingId(null);
        }
    };

    const handleExport = (listId: string, listName: string) => {
        const reefs = getSavedReefsInList(listId, allReefs);
        if (reefs.length === 0) return;

        if (exportFormat === 'gpx') downloadFile(exportToGPX(reefs), `${listName}.gpx`, 'application/gpx+xml');
        if (exportFormat === 'kml') downloadFile(exportToKML(reefs), `${listName}.kml`, 'application/vnd.google-earth.kml+xml');
        if (exportFormat === 'csv') downloadFile(exportToCSV(reefs), `${listName}.csv`, 'text/csv');
    }

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">My Reef Lists</h2>
                        <p className="text-slate-400 text-sm mt-1">Manage and export your saved spots</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Create New List */}
                    <form onSubmit={handleCreate} className="flex gap-2">
                        <input
                            type="text"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            placeholder="New list name (e.g. 'Key West Trip')"
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!newListName.trim()}
                            className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-6 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                        >
                            <Plus size={20} />
                            <span>Create</span>
                        </button>
                    </form>

                    {/* Lists Grid */}
                    <div className="space-y-4">
                        {lists.map(list => {
                            const reefsInList = getSavedReefsInList(list.id, allReefs);
                            const isExpanded = expandedListId === list.id;

                            return (
                                <div key={list.id} className={`group bg-white/5 border border-white/5 rounded-xl transition-all overflow-hidden ${isExpanded ? 'border-cyan-500/30 bg-white/[0.08]' : 'hover:border-white/10'}`}>

                                    {/* List Header / Summary */}
                                    <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">

                                        {/* Info & Expand Toggle */}
                                        <div className="flex-1 min-w-0 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedListId(isExpanded ? null : list.id)}>
                                            <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-400 group-hover:text-cyan-400'}`}>
                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </div>

                                            <div className="flex-1">
                                                {editingId === list.id ? (
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-cyan-500/50 w-full"
                                                        autoFocus
                                                        onBlur={() => handleRename(list.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleRename(list.id)}
                                                    />
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-lg font-semibold text-white truncate">{list.name}</h3>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                                                            {list.reefIds.length} spots
                                                        </span>
                                                    </div>
                                                )}
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Updated {new Date(list.updatedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions Toolbar */}
                                        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0" onClick={(e) => e.stopPropagation()}>

                                            {/* Export Options */}
                                            <div className="flex items-center bg-black/40 rounded-lg p-1 mr-2">
                                                <button
                                                    onClick={() => setExportFormat('gpx')}
                                                    className={`p-1.5 rounded transition-colors ${exportFormat === 'gpx' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white'}`}
                                                    title="GPX"
                                                >
                                                    <MapIcon size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setExportFormat('kml')}
                                                    className={`p-1.5 rounded transition-colors ${exportFormat === 'kml' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white'}`}
                                                    title="KML"
                                                >
                                                    <Globe size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setExportFormat('csv')}
                                                    className={`p-1.5 rounded transition-colors ${exportFormat === 'csv' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white'}`}
                                                    title="CSV"
                                                >
                                                    <FileText size={14} />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => handleExport(list.id, list.name)}
                                                className="p-2 bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 rounded-lg transition-colors"
                                                title="Export List"
                                            >
                                                <Download size={18} />
                                            </button>

                                            <div className="w-px h-6 bg-white/10 mx-1"></div>

                                            <button
                                                onClick={() => {
                                                    setEditingId(list.id);
                                                    setEditName(list.name);
                                                }}
                                                className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors"
                                                title="Rename"
                                            >
                                                <Edit2 size={18} />
                                            </button>

                                            {list.id !== 'default' && (
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Delete this list?')) deleteList(list.id);
                                                    }}
                                                    className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Content: List Items */}
                                    {isExpanded && (
                                        <div className="border-t border-white/10 bg-black/20 p-4">
                                            {reefsInList.length === 0 ? (
                                                <p className="text-center text-slate-500 text-sm py-2">No saved reefs in this list yet.</p>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {reefsInList.map((reef, idx) => {
                                                        const rId = reef.properties.ObjectId || reef.properties.OBJECTID;
                                                        return (
                                                            <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-colors group/item">
                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                    <MapPin size={16} className="text-cyan-500 shrink-0" />
                                                                    <div className="truncate">
                                                                        <div className="text-sm font-medium text-slate-200 truncate">{reef.properties.Name}</div>
                                                                        <div className="text-[10px] text-slate-500">{reef.properties.County} • {reef.properties.Depth}ft</div>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => rId && removeReefFromList(list.id, rId)}
                                                                    className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover/item:opacity-100"
                                                                    title="Remove from list"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {lists.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            <p>No lists yet. Create one to get started!</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-white/5 text-center text-xs text-slate-500">
                    <p>Exported formats compatible with most Simrad, Lowrance, Garmin, and Humminbird units.</p>
                </div>
            </div>
        </div>
    );
};
