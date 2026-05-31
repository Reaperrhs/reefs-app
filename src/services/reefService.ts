
import type { ReefGeoJSON, ReefFeature } from '../types/reef';

// Default path to the file in public folder
const DEFAULT_DATA_URL = '/Artificial_Reefs_in_Florida.geojson';

export class ReefService {

    static async fetchReefs(url: string = DEFAULT_DATA_URL): Promise<ReefFeature[]> {
        try {
            // Load both datasets in parallel
            const [floridaReefs, alabamaReefs] = await Promise.all([
                this.fetchFloridaReefs(url),
                this.fetchAlabamaReefs()
            ]);

            return [...floridaReefs, ...alabamaReefs];
        } catch (error) {
            console.error("ReefService Error:", error);
            throw error;
        }
    }

    private static async fetchFloridaReefs(url: string): Promise<ReefFeature[]> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch Florida data: ${response.statusText}`);
        }
        const data: ReefGeoJSON = await response.json();
        // Tag Florida reefs
        const features = data.features || [];
        features.forEach(f => f.properties.State = 'FL');
        return this.normalizeFeatures(features);
    }

    private static async fetchAlabamaReefs(): Promise<ReefFeature[]> {
        try {
            const response = await fetch('/alabama_reefs.json');
            if (!response.ok) {
                console.warn('Alabama reefs file not found or failed to load');
                return [];
            }
            const data: ReefFeature[] = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to load Alabama reefs:', error);
            return [];
        }
    }

    static parseGPX(xmlText: string): ReefFeature[] {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const wpts = xmlDoc.getElementsByTagName("wpt");
        const features: ReefFeature[] = [];

        for (let i = 0; i < wpts.length; i++) {
            const wpt = wpts[i];
            const lat = parseFloat(wpt.getAttribute("lat") || "0");
            const lon = parseFloat(wpt.getAttribute("lon") || "0");

            // Basic metadata
            const name = wpt.getElementsByTagName("name")[0]?.textContent || "Unknown Reef";

            // Extract embedded HTML description for detailed properties
            const cmt = wpt.getElementsByTagName("cmt")[0]?.textContent || "";
            const props: any = {
                Name: name,
                County: "Alabama", // Default if Zone not found
                MatCat: "Other",
                Depth: 0,
                State: "AL"
            };

            if (cmt) {
                const htmlDoc = parser.parseFromString(cmt, "text/html");
                const rows = htmlDoc.getElementsByTagName("tr");

                // Iterate directly through TRs to find key-value pairs
                // The structure is roughly <td>Key</td><td>Value</td>
                let structure = "";
                let reefType = "";
                let rawMaterial = "";

                for (let r = 0; r < rows.length; r++) {
                    const cells = rows[r].getElementsByTagName("td");
                    if (cells.length >= 2) {
                        const key = cells[0].textContent?.trim() || "";
                        const val = cells[1].textContent?.trim() || "";

                        if (key.includes("Zone")) {
                            // Clean up Zone value (remove any potential HTML or extra spaces)
                            const zone = val.replace(/<[^>]*>?/gm, '').trim();
                            props.County = zone || "Alabama";
                        }
                        else if (key === "Material") rawMaterial = val;
                        else if (key === "Structure") structure = val;
                        else if (key.includes("Reef Type")) reefType = val;
                        else if (key.includes("Depth")) props.Depth = parseFloat(val) || 0;
                        else if (key.includes("Reef Name") && val) props.Name = val; // Override name if present in table
                    }
                }

                // Determine Material Category and Display Material
                // Priority for display: Material > Structure > Reef Type > MatCat

                // 1. Try Material
                if (rawMaterial) {
                    props.Material = rawMaterial;
                    const normalized = this.normalizeMaterial(rawMaterial);
                    if (normalized !== 'Other') props.MatCat = normalized;
                }

                // 2. Try Structure (if MatCat is still Other or for Display fallback)
                if (structure) {
                    if (!props.Material) props.Material = structure;
                    if (props.MatCat === 'Other') {
                        const normalized = this.normalizeMaterial(structure);
                        if (normalized !== 'Other') props.MatCat = normalized;
                    }
                }

                // 3. Try Reef Type (if MatCat is still Other or for Display fallback)
                if (reefType) {
                    if (!props.Material) props.Material = reefType;
                    if (props.MatCat === 'Other') {
                        const normalized = this.normalizeMaterial(reefType);
                        if (normalized !== 'Other') props.MatCat = normalized;
                    }
                }
            }

            // Final check: If name or structure indicates a Rig/Platform, force the category
            // This covers cases where Material might be "Steel" but the Name is "Main Pass 255 Platform"
            if (props.MatCat !== 'Oil Rigs & Platforms') {
                const nameCat = this.normalizeMaterial(props.Name || '');
                if (nameCat === 'Oil Rigs & Platforms') {
                    props.MatCat = 'Oil Rigs & Platforms';
                    if (!props.Material) props.Material = "Oil Rig / Platform"; // Fallback display if absolutely nothing else existed
                }
            }

            features.push({
                type: "Feature",
                properties: {
                    ObjectId: 100000 + i, // Generate synthetic ID for Alabama reefs to avoid collision
                    ...props
                },
                geometry: {
                    type: "Point",
                    coordinates: [lon, lat]
                }
            });
        }

        return this.normalizeFeatures(features);
    }

    private static normalizeMaterial(raw: string): string {
        const lower = raw.toLowerCase();

        // Stricter regex for Rigs/Platforms to avoid false positives (like 'spoil' matching 'oil')
        // Must be whole words or specific phrases
        if (lower.match(/\b(platform|jacket)\b/) || lower.match(/\b(oil|gas)\s+(rig|platform|well)\b/) || lower.match(/\b(production)\s+(platform)\b/)) {
            return 'Oil Rigs & Platforms';
        }

        if (lower.match(/vessel|barge|ship|boat|tug|ferry/)) return 'Vessel';
        if (lower.match(/concrete|culvert|rubble|pipe|bridge|pile/)) return 'Concrete';
        if (lower.match(/module|pyramid|ball|tetrahedron|reef\s?ball/)) return 'Module';
        if (lower.match(/metal|steel|tank|car|bus|truck|coop|cage/)) return 'Metal';
        if (lower.match(/rock|limestone|boulder/)) return 'Rock';

        return 'Other';
    }

    static async parseFile(file: File): Promise<ReefFeature[]> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const result = e.target?.result as string;
                    // Check if it looks like JSON or GPX
                    if (result.trim().startsWith('{')) {
                        const data: ReefGeoJSON = JSON.parse(result);
                        resolve(this.normalizeFeatures(data.features || []));
                    } else if (result.includes('<gpx')) {
                        resolve(this.parseGPX(result));
                    } else {
                        reject(new Error("Unknown file format"));
                    }
                } catch (err) {
                    reject(new Error("Invalid file"));
                }
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsText(file);
        });
    }

    private static normalizeFeatures(features: ReefFeature[]): ReefFeature[] {
        return features.map(f => {
            const props = f.properties || {};

            // Fix case sensitivity issues from raw GeoJSON (OBJECTID vs ObjectId)
            if (props.OBJECTID !== undefined && props.ObjectId === undefined) {
                props.ObjectId = props.OBJECTID;
            }

            // Map Florida 'MatDescrip' to 'Material' for display
            if (props.MatDescrip && !props.Material) {
                props.Material = props.MatDescrip;
            }

            // Fallback ID generation if absolutely nothing exists (to prevent bugs)
            if (props.ObjectId === undefined) {
                console.warn('Reef missing ObjectId, generating fallback:', props.Name);
                props.ObjectId = Math.floor(Math.random() * 10000000) + Date.now();
            }
            // Ensure numbers for Depth logic
            if (typeof props.Depth === 'string') {
                const match = props.Depth.match(/(\d+(\.\d+)?)/);
                props.Depth = match ? parseFloat(match[0]) : 0;
            }

            f.properties = props; // Reassign modified properties back to feature
            return f;
        });
    }
}
