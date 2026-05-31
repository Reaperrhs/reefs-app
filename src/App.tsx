
import { useState, useMemo } from 'react';
import ReefMap from './components/Map/ReefMap';
import { useReefs } from './hooks/useReefs';
import { useSavedReefs } from './hooks/useSavedReefs';
import { SEO } from './components/SEO';
import { GlassPanel } from './components/UI/GlassPanel';
import { ListsManager } from './components/UI/ListsManager';
import { AddToListsModal } from './components/UI/AddToListsModal';
import { Upload, Search, Filter, Map as MapIcon, Info, Menu, X, Heart, List, ChevronDown, Trash2, Plus, Edit2, Download, Check, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReefFeature } from './types/reef';

function App() {
  const { reefs, allReefs, loading, error, filters, handleFileUpload, totalReefs } = useReefs();
  const { lists, toggleSaved, getSavedReefsInList, removeReefFromList, deleteList, renameList } = useSavedReefs();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isListsManagerOpen, setListsManagerOpen] = useState(false);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [reefsToManage, setReefsToManage] = useState<ReefFeature[]>([]);
  const [view, setView] = useState<'explore' | 'saved'>('explore');

  // State for navigating to a specific reef
  const [selectedReef, setSelectedReef] = useState<ReefFeature | null>(null);

  // States for map layers controls
  const [baseMap, setBaseMap] = useState<'dark' | 'topo' | 'voyager'>('dark');

  // Derive consolidated saved IDs for the map (show heart for any saved reef)
  const savedReefIds = useMemo(() => {
    const set = new Set<number>();
    lists.forEach(list => list.reefIds.forEach(id => set.add(id)));
    return set;
  }, [lists]);



  const handleManageLists = (id: number) => {
    const reef = allReefs.find(r => (r.properties.ObjectId || r.properties.OBJECTID) === id);
    if (reef) {
      setReefsToManage([reef]);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900 text-slate-100 font-sans selection:bg-cyan-500/30">
      <SEO />

      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <ReefMap
          reefs={reefs}
          savedReefIds={savedReefIds}
          onToggleSaved={toggleSaved}
          onManageLists={handleManageLists}
          selectedReef={selectedReef}
          baseMap={baseMap}
        />
      </div>

      {/* Lists Manager Modal */}
      <ListsManager
        isOpen={isListsManagerOpen}
        onClose={() => setListsManagerOpen(false)}
        allReefs={allReefs}
      />

      {/* Add To List Modal */}
      <AddToListsModal
        isOpen={reefsToManage.length > 0}
        onClose={() => setReefsToManage([])}
        reefs={reefsToManage}
      />

      {/* Header Overlay */}
      <header className="absolute top-0 left-0 right-0 z-[1000] p-4 pointer-events-none">
        <div className="flex justify-between items-start gap-4">
          <GlassPanel className="pointer-events-auto p-4 flex items-center gap-3 animate-fade-in-down w-full md:w-80">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg shadow-lg shadow-cyan-500/20 shrink-0">
              <MapIcon className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-tight">Florida Reefs</h1>
              <p className="text-xs text-cyan-200 font-medium tracking-wide uppercase">Interactive Explorer</p>
            </div>
          </GlassPanel>

          <div className="flex gap-2 pointer-events-auto shrink-0">
            <GlassPanel className="p-2 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors md:hidden" onClick={() => setSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </GlassPanel>
          </div>
        </div>
      </header>

      {/* Stats Floating Card (Bottom Right) */}
      <div className="absolute bottom-6 right-6 z-[1000] pointer-events-none hidden md:block">
        <GlassPanel className="pointer-events-auto p-4 min-w-[200px] border-l-4 border-l-cyan-500">
          <div className="text-xs text-slate-400 font-bold uppercase mb-1">Total Reefs</div>
          <div className="text-3xl font-bold text-white tracking-tighter">
            {loading ? '...' : totalReefs.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Data
          </div>
        </GlassPanel>
      </div>

      {/* Sidebar Controls (Left) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-24 md:top-24 left-4 right-4 md:right-auto z-[999] w-[calc(100%-2rem)] md:w-80 flex flex-col gap-4 max-h-[calc(100vh-140px)] overflow-hidden pointer-events-none"
          >
            <GlassPanel className="pointer-events-auto p-5 flex flex-col gap-5 overflow-y-auto max-h-full">

              {/* View Toggle */}
              <div className="flex bg-slate-800/50 p-1 rounded-lg shrink-0">
                <button
                  onClick={() => setView('explore')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${view === 'explore' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'}`}
                >
                  <Search className="w-3 h-3" /> Explore
                </button>
                <button
                  onClick={() => setView('saved')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${view === 'saved' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'}`}
                >
                  <Heart className="w-3 h-3" fill={view === 'saved' ? "currentColor" : "none"} /> Saved ({savedReefIds.size})
                </button>
              </div>

              {view === 'explore' ? (
                <>
                  {/* Search */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                      Search
                    </label>
                    <input
                      type="text"
                      placeholder="Find a reef..."
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                      value={filters.searchQuery}
                      onChange={(e) => filters.setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Filters */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                      <Filter className="w-3 h-3" /> Filters
                    </label>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">State</span>
                        <select
                          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                          value={filters.selectedState}
                          onChange={(e) => {
                            filters.setSelectedState(e.target.value);
                            filters.setSelectedCounty('All'); // Reset county on state change
                          }}
                        >
                          <option value="All">All States</option>
                          <option value="FL">Florida</option>
                          <option value="AL">Alabama</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">Counties / Zones</span>
                        <select
                          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                          value={filters.selectedCounty}
                          onChange={(e) => filters.setSelectedCounty(e.target.value)}
                        >
                          <option value="All">All Counties / Zones</option>
                          {filters.counties.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">Material Type</span>
                        <select
                          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                          value={filters.selectedMaterial}
                          onChange={(e) => filters.setSelectedMaterial(e.target.value)}
                        >
                          <option value="All">All Materials</option>
                          {filters.materials.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1">
                          <span className="text-[10px] text-slate-500 block mb-1">Min Depth (ft)</span>
                          <input
                            type="number"
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                            placeholder="0"
                            value={filters.minDepth}
                            onChange={(e) => filters.setMinDepth(e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] text-slate-500 block mb-1">Max Depth (ft)</span>
                          <input
                            type="number"
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                            placeholder="Any"
                            value={filters.maxDepth}
                            onChange={(e) => filters.setMaxDepth(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-slate-700/50 my-1" />

                  {/* Upload Action */}
                  <div>
                    <label className="flex items-center justify-center w-full gap-2 p-3 border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl cursor-pointer transition-colors group">
                      <Upload className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                      <span className="text-xs font-medium text-slate-400 group-hover:text-cyan-100">Upload GeoJSON</span>
                      <input
                        type="file"
                        accept=".geojson,.json"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      />
                    </label>
                  </div>

                  {/* Info / Status */}
                  <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Showing <span className="text-white font-bold">{reefs.length}</span> results.
                        Map clustering is active. Hover over clusters to see bounds.
                      </p>
                    </div>

                    <button
                      onClick={() => setReefsToManage(reefs)}
                      disabled={reefs.length === 0}
                      className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold text-xs uppercase tracking-wide rounded-lg border border-cyan-500/50 hover:border-cyan-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Heart className="w-3 h-3" /> Add All to List
                    </button>
                  </div>
                </>
              ) : (
                /* Saved View - Master-Detail Architecture */
                <div className="flex flex-col h-full">
                  {!activeListId ? (
                    /* MASTER VIEW: All Collections */
                    <div className="flex flex-col gap-4 animate-fade-in">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Collections</span>
                        <button
                          onClick={() => setListsManagerOpen(true)}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-2 py-1 rounded hover:bg-cyan-500/20 transition-all"
                        >
                          <List size={12} /> Manage All
                        </button>
                      </div>

                      <div className="space-y-3">
                        {/* Favorites Card (Always First) */}
                        <div
                          onClick={() => setActiveListId('default')}
                          className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700/50 hover:border-cyan-500/50 cursor-pointer group transition-all shadow-sm hover:shadow-cyan-500/10"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                              <Heart className="w-5 h-5 text-red-500 fill-red-500/20" />
                            </div>
                            <span className="text-xs font-mono text-slate-500">{getSavedReefsInList('default', allReefs).length} spots</span>
                          </div>
                          <h3 className="font-bold text-white text-lg">Favorites</h3>
                          <p className="text-xs text-slate-400 mt-1">Your quick-saved spots</p>
                        </div>

                        {/* User Created Lists */}
                        {lists.filter(l => l.id !== 'default').map(list => {
                          const count = list.reefIds.length;
                          const isEditing = editingListId === list.id;

                          return (
                            <div
                              key={list.id}
                              onClick={() => !isEditing && setActiveListId(list.id)}
                              className={`p-4 rounded-xl border transition-all shadow-sm ${isEditing
                                ? 'bg-slate-800 border-cyan-500 ring-1 ring-cyan-500/50'
                                : 'bg-slate-800/40 border-slate-700/50 hover:border-cyan-500/40 cursor-pointer group hover:bg-slate-800'
                                }`}
                            >
                              {isEditing ? (
                                /* Edit Mode UI */
                                <div className="flex flex-col gap-3 animate-fade-in" onClick={e => e.stopPropagation()}>
                                  <label className="text-[10px] uppercase font-bold text-cyan-500">Editing List</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      autoFocus
                                      type="text"
                                      defaultValue={list.name}
                                      className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-cyan-500"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          renameList(list.id, e.currentTarget.value);
                                          setEditingListId(null);
                                        }
                                        if (e.key === 'Escape') setEditingListId(null);
                                      }}
                                    />
                                    <button
                                      onClick={() => {
                                        // Find input value
                                        const input = document.querySelector(`input[value="${list.name}"]`) as HTMLInputElement | null;
                                        if (input) renameList(list.id, input.value);
                                        setEditingListId(null);
                                      }}
                                      className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded hover:bg-emerald-500/20"
                                      title="Save"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                                    <button
                                      onClick={() => {
                                        if (confirm('Are you sure you want to delete this list?')) {
                                          deleteList(list.id);
                                          setEditingListId(null);
                                        }
                                      }}
                                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" /> Delete List
                                    </button>

                                    <button
                                      onClick={() => setEditingListId(null)}
                                      className="text-xs text-slate-400 hover:text-slate-300"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* Normal View UI */
                                <div className="relative">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                                      <MapIcon className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <span className="text-xs font-mono text-slate-500">{count} spots</span>
                                  </div>

                                  <div className="flex justify-between items-end">
                                    <div>
                                      <h3 className="font-bold text-slate-200 group-hover:text-cyan-100 text-base truncate max-w-[140px]">{list.name}</h3>
                                      <p className="text-[10px] text-slate-500 mt-1">Updated {new Date(list.updatedAt).toLocaleDateString()}</p>
                                    </div>

                                    {/* Quick Actions (Show on hover or always visible for discoverability) */}
                                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                      <button
                                        onClick={() => setEditingListId(list.id)}
                                        className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded transition-all"
                                        title="Edit"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setListsManagerOpen(true);
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-white text-[10px] font-bold uppercase tracking-wide rounded-md shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
                                        title="Export List"
                                      >
                                        <Download className="w-3 h-3" /> Export
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Create New Prompt */}
                        {lists.length === 1 && (
                          <button
                            onClick={() => setListsManagerOpen(true)}
                            className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                          >
                            <Plus className="w-4 h-4" /> Create New List
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* DETAIL VIEW: Single List Items */
                    <div className="flex flex-col h-full animate-slide-in-right">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-700/50">
                        <button
                          onClick={() => setActiveListId(null)}
                          className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                          <ChevronDown className="w-5 h-5 rotate-90" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-bold text-white truncate">
                            {lists.find(l => l.id === activeListId)?.name || 'Unknown List'}
                          </h2>
                        </div>
                        <button
                          onClick={() => setListsManagerOpen(true)}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors"
                          title="List Settings"
                        >
                          <List size={16} />
                        </button>
                      </div>

                      {/* Reef Items */}
                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                        {getSavedReefsInList(activeListId, allReefs).length === 0 ? (
                          <div className="text-center py-10 text-slate-500">
                            <p className="text-sm">This list is empty.</p>
                            <button onClick={() => setView('explore')} className="text-cyan-500 text-xs font-bold mt-2 hover:underline">Find spots to add</button>
                          </div>
                        ) : (
                          getSavedReefsInList(activeListId, allReefs).map((reef, idx) => (
                            <div
                              key={reef.properties.ObjectId || reef.properties.OBJECTID || `saved-${idx}`}
                              onClick={() => setSelectedReef(reef)}
                              className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex justify-between items-start group hover:border-cyan-500/30 transition-colors cursor-pointer hover:bg-slate-800"
                            >
                              <div>
                                <h4 className="font-bold text-sm text-slate-200 group-hover:text-cyan-400 transition-colors line-clamp-1">{reef.properties.Name}</h4>
                                <p className="text-[10px] text-slate-400">{reef.properties.County} • {reef.properties.MatCat}</p>
                              </div>

                              {/* Quick Action: Remove from this specific list */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rId = reef.properties.ObjectId || reef.properties.OBJECTID;
                                  if (rId && activeListId) {
                                    // If default list, use toggle to keep heart sync logic, otherwise remove directly
                                    if (activeListId === 'default') toggleSaved(rId);
                                    else removeReefFromList(activeListId, rId);
                                  }
                                }}
                                className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove from list"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-slate-700/50 my-1 shrink-0" />

              {/* Map Layers & Navigation Panel */}
              <div className="flex flex-col gap-3 shrink-0">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" /> Map Layers
                </label>

                {/* Base Map Selector */}
                <div className="grid grid-cols-3 bg-slate-800/50 p-1 rounded-lg">
                  <button
                    onClick={() => setBaseMap('dark')}
                    className={`py-1 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                      baseMap === 'dark'
                        ? 'bg-slate-700 text-cyan-400 shadow-sm border border-slate-600'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => setBaseMap('voyager')}
                    className={`py-1 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                      baseMap === 'voyager'
                        ? 'bg-slate-700 text-cyan-400 shadow-sm border border-slate-600'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Blue
                  </button>
                  <button
                    onClick={() => setBaseMap('topo')}
                    className={`py-1 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                      baseMap === 'topo'
                        ? 'bg-slate-700 text-cyan-400 shadow-sm border border-slate-600'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Topo
                  </button>
                </div>
              </div>

            </GlassPanel>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[2000] bg-slate-900 flex items-center justify-center flex-col gap-4"
          >
            <div className="w-12 h-12 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin" />
            <p className="text-cyan-500 text-sm font-bold tracking-widest uppercase animate-pulse">Exploring Reefs...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      {error && (
        <div className="absolute top-24 right-4 z-[2000] max-w-sm">
          <GlassPanel className="p-4 border-l-4 border-l-red-500 flex items-center gap-3 bg-red-900/20">
            <Info className="text-red-400 w-5 h-5" />
            <p className="text-sm text-red-100">{error}</p>
          </GlassPanel>
        </div>
      )}

    </div>
  );
}

export default App;
