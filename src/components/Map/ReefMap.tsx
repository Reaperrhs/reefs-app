
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { ReefFeature } from '../../types/reef';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

// Fix for default Leaflet icon issues in React
import iconMarker2x from 'leaflet/dist/images/marker-icon-2x.png';
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconMarker2x,
    iconUrl: iconMarker,
    shadowUrl: iconShadow,
});

interface ReefMapProps {
    reefs: ReefFeature[];
    savedReefIds: Set<number>;
    onToggleSaved: (id: number) => void;
    onManageLists: (id: number) => void;
    selectedReef: ReefFeature | null;
    baseMap?: 'dark' | 'topo' | 'voyager';
}

const materialConfig: Record<string, { icon: string; color: string; label: string }> = {
    'Vessel': { icon: '🚢', color: '#1e40af', label: 'Ships / Vessels' },
    'Module': { icon: '🧊', color: '#059669', label: 'Reef Modules' },
    'Concrete': { icon: '🧱', color: '#64748b', label: 'Concrete / Culverts' },
    'Metal': { icon: '⚙️', color: '#0891b2', label: 'Metal / Steel' },
    'Rock': { icon: '🪨', color: '#b45309', label: 'Rock / Boulders' },
    'Oil Rigs & Platforms': { icon: '🏗️', color: '#8b5cf6', label: 'Oil Rigs & Platforms' },
    'Other': { icon: '📍', color: '#94a3b8', label: 'Other / Mixed' }
};

const getMarkerIcon = (matCat: string) => {
    const config = materialConfig[matCat] || materialConfig['Other'];
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="reef-marker" style="background-color: ${config.color}; border: 2px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                 <span style="transform: rotate(45deg); font-size: 14px;">${config.icon}</span>
               </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
};

const createClusterCustomIcon = function (cluster: any) {
    return L.divIcon({
        html: `<div style="background-color: rgba(15, 23, 42, 0.9);" class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border-2 border-cyan-500 shadow-lg backdrop-blur-sm">
            ${cluster.getChildCount()}
        </div>`,
        className: 'custom-marker-cluster',
        iconSize: L.point(40, 40, true),
    });
};

// Custom Component to handle Clustering logic manually safely
const MarkerClusterer = ({ reefs, savedReefIds, onToggleSaved, onManageLists, selectedReef }: { reefs: ReefFeature[], savedReefIds: Set<number>, onToggleSaved: (id: number) => void, onManageLists: (id: number) => void, selectedReef: ReefFeature | null }) => {
    const map = useMap();

    // Refs to store latest state/callbacks for event listeners
    const savedIdsRef = useRef(savedReefIds);
    const onToggleRef = useRef(onToggleSaved);
    const onManageRef = useRef(onManageLists);
    const groupRef = useRef<L.MarkerClusterGroup | null>(null);
    const markersRef = useRef<Map<number, L.Marker>>(new Map());

    useEffect(() => {
        savedIdsRef.current = savedReefIds;
        onToggleRef.current = onToggleSaved;
        onManageRef.current = onManageLists;
    }, [savedReefIds, onToggleSaved, onManageLists]);

    // Handle selection changes
    useEffect(() => {
        try {
            if (!selectedReef || !map) return;

            const id = selectedReef.properties.ObjectId || selectedReef.properties.OBJECTID;
            if (!id) return;

            const lat = selectedReef.geometry.coordinates[1];
            const lng = selectedReef.geometry.coordinates[0];
            const latLng = L.latLng(lat, lng);

            // Get marker reference
            const marker = markersRef.current.get(id);
            const group = groupRef.current;

            if (marker && group) {
                if (typeof group.zoomToShowLayer === 'function') {
                    group.zoomToShowLayer(marker, () => {
                        marker.openPopup();
                    });
                } else {
                    map.flyTo(latLng, 14, { duration: 1.5 });
                    marker.openPopup();
                }
            } else {
                map.flyTo(latLng, 14, { duration: 1.5 });
            }

        } catch (err) {
            console.error("Navigation error:", err);
        }

    }, [selectedReef, map]);

    useEffect(() => {
        if (!map || !reefs) return;

        try {
            markersRef.current.clear(); // Clear ref map

            const markerClusterGroup = L.markerClusterGroup({
                iconCreateFunction: createClusterCustomIcon,
                showCoverageOnHover: false,
                maxClusterRadius: 60,
                spiderfyOnMaxZoom: true,
            });

            groupRef.current = markerClusterGroup;

            const markers = reefs.map((reef) => {
                const lat = reef.geometry.coordinates[1];
                const lng = reef.geometry.coordinates[0];
                const p = reef.properties;

                const objId = p.ObjectId || p.OBJECTID || 0;

                const marker = L.marker([lat, lng], { icon: getMarkerIcon(p.MatCat) });

                if (objId) {
                    markersRef.current.set(objId, marker);
                }

                // Create DOM element for popup
                const popupContent = document.createElement('div');
                popupContent.innerHTML = `
                    <div class="min-w-[220px] p-1 font-sans group">
                        <div class="flex items-center justify-between gap-2 mb-3 border-b border-slate-200 pb-2">
                            <div class="flex items-center gap-2">
                                 <span class="text-2xl">${(materialConfig[p.MatCat] || materialConfig['Other']).icon}</span>
                                 <h3 class="font-bold text-slate-800 text-base leading-tight">${p.Name || 'Unnamed Reef'}</h3>
                            </div>
                            <div class="flex items-center gap-1">
                                <button class="manage-reef-btn p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer text-slate-400 hover:text-cyan-600" title="Add to List" data-id="${objId}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                </button>
                                <button class="save-reef-btn p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer" style="pointer-events: auto;" data-id="${objId}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="heart-icon text-slate-400" style="transition: all 0.2s ease;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                </button>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                            <span class="text-slate-500 font-semibold uppercase">County</span>
                            <span class="font-medium text-slate-900">${p.County}</span>
                            
                            <span class="text-slate-500 font-semibold uppercase">Depth</span>
                            <span class="font-medium text-slate-900">${p.Depth} ft</span>
                            
                            <span class="text-slate-500 font-semibold uppercase">Material</span>
                            <span class="text-cyan-600 font-bold">${p.Material || p.MatCat}</span>
                            
                            <span class="text-slate-500 font-semibold uppercase">Deployed</span>
                            <span class="font-medium text-slate-900">${p.DeployDate || 'N/A'}</span>

                            <span class="text-slate-500 font-semibold uppercase">GPS</span>
                            <button class="copy-gps-btn font-medium text-slate-900 font-mono text-[10px] hover:text-cyan-600 hover:bg-slate-100 px-1.5 py-0.5 rounded cursor-copy flex items-center gap-1 transition-colors -ml-1.5" data-lat="${lat}" data-lng="${lng}" title="Click to Copy">
                                <span>${lat.toFixed(5)}, ${lng.toFixed(5)}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                        </div>
                         ${p.Description ? `<div class="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600 italic">${p.Description}</div>` : ''}
                    </div>
                 `;

                // Attach Event Listeners
                const btnSave = popupContent.querySelector('.save-reef-btn') as HTMLElement;
                const btnManage = popupContent.querySelector('.manage-reef-btn') as HTMLElement;
                const btnCopy = popupContent.querySelector('.copy-gps-btn') as HTMLElement;

                if (btnCopy) {
                    L.DomEvent.disableClickPropagation(btnCopy);
                    btnCopy.onclick = (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const latVal = btnCopy.getAttribute('data-lat');
                        const lngVal = btnCopy.getAttribute('data-lng');

                        if (latVal && lngVal) {
                            const text = `${parseFloat(latVal).toFixed(5)}, ${parseFloat(lngVal).toFixed(5)}`;
                            navigator.clipboard.writeText(text).then(() => {
                                const span = btnCopy.querySelector('span');
                                if (span) {
                                    const originalText = span.innerText;
                                    span.innerText = 'Copied!';
                                    span.className = "text-emerald-600 font-bold";
                                    setTimeout(() => {
                                        span.innerText = originalText;
                                        span.className = "";
                                    }, 1500);
                                }
                            });
                        }
                    };
                }

                if (btnSave) {
                    L.DomEvent.disableClickPropagation(btnSave);
                    btnSave.onclick = (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (objId) onToggleRef.current(objId);

                        // Optimistic UI
                        const svg = btnSave.querySelector('svg');
                        if (svg) {
                            const isFilled = svg.style.fill === 'rgb(239, 68, 68)' || svg.style.fill === '#ef4444';
                            svg.style.fill = isFilled ? 'none' : '#ef4444';
                            svg.style.color = isFilled ? '#94a3b8' : '#ef4444';
                        }
                    };
                }

                if (btnManage) {
                    L.DomEvent.disableClickPropagation(btnManage);
                    btnManage.onclick = (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (objId) onManageRef.current(objId);
                    };
                }

                marker.bindPopup(popupContent);
                return marker;
            });

            markerClusterGroup.addLayers(markers);
            map.addLayer(markerClusterGroup);

            if (markers.length > 0) {
                map.fitBounds(markerClusterGroup.getBounds(), { padding: [50, 50] });
            }

            // Sync visual state when popup opens
            const handlePopupOpen = (e: L.PopupEvent) => {
                const content = e.popup.getElement();
                if (!content) return;

                const btn = content.querySelector('.save-reef-btn') as HTMLElement;
                if (btn) {
                    const id = parseInt(btn.getAttribute('data-id') || '0');
                    if (!id) return;

                    const isSaved = savedIdsRef.current.has(id);
                    const svg = btn.querySelector('svg');
                    if (svg) {
                        svg.style.fill = isSaved ? '#ef4444' : 'none';
                        svg.style.color = isSaved ? '#ef4444' : '#94a3b8';
                    }
                }
            };

            map.on('popupopen', handlePopupOpen);

            return () => {
                map.removeLayer(markerClusterGroup);
                map.off('popupopen', handlePopupOpen);
                groupRef.current = null;
                markersRef.current.clear();
            };
        } catch (e) {
            console.error("Error in ReefMap effect:", e);
        }
    }, [map, reefs]);

    return null;
};

export default function ReefMap({
    reefs,
    savedReefIds,
    onToggleSaved,
    onManageLists,
    selectedReef,
    baseMap = 'dark'
}: ReefMapProps) {
    return (
        <MapContainer
            center={[27.6648, -81.5158]}
            zoom={7}
            className="w-full h-full z-0 bg-slate-900"
            zoomControl={false}
            zoomSnap={0.5}
            zoomDelta={0.5}
            wheelPxPerZoomLevel={120}
            scrollWheelZoom={true}
            style={{ background: '#0f172a' }}
        >
            {baseMap === 'dark' && (
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
            )}
            {baseMap === 'voyager' && (
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
            )}
            {baseMap === 'topo' && (
                <TileLayer
                    attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
                    url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                />
            )}

            <MarkerClusterer reefs={reefs} savedReefIds={savedReefIds} onToggleSaved={onToggleSaved} onManageLists={onManageLists} selectedReef={selectedReef} />
        </MapContainer>
    );
}
