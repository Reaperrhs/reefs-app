
export interface ReefProperties {
    ObjectId?: number;
    OBJECTID?: number;
    County: string;
    Name: string;
    MatCat: string; // Material Category
    Depth: number | string;
    DeployDate?: string;
    Description?: string;
    State?: string;
    Material?: string; // Display name for material
    [key: string]: any;
}

export interface ReefList {
    id: string;
    name: string;
    reefIds: number[];
    createdAt: number;
    updatedAt: number;
}

export interface ReefFeature {
    type: "Feature";
    properties: ReefProperties;
    geometry: {
        type: "Point";
        coordinates: [number, number]; // [lng, lat]
    };
}

export interface ReefGeoJSON {
    type: "FeatureCollection";
    features: ReefFeature[];
}

export type MaterialCategory = 'Vessel' | 'Module' | 'Concrete' | 'Metal' | 'Rock' | 'Oil Rigs & Platforms' | 'Other';
