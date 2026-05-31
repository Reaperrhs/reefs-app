
import { useState, useEffect, useMemo } from 'react';
import type { ReefFeature } from '../types/reef';
import { ReefService } from '../services/reefService';


export const useReefs = () => {
    const [allReefs, setAllReefs] = useState<ReefFeature[]>([]);
    const [filteredReefs, setFilteredReefs] = useState<ReefFeature[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedState, setSelectedState] = useState('All');
    const [selectedCounty, setSelectedCounty] = useState('All');
    const [selectedMaterial, setSelectedMaterial] = useState('All');
    const [minDepth, setMinDepth] = useState('');
    const [maxDepth, setMaxDepth] = useState('');

    // Initial Fetch
    useEffect(() => {
        loadReefs();
    }, []);

    const loadReefs = async () => {
        setLoading(true);
        try {
            const reefs = await ReefService.fetchReefs();
            setAllReefs(reefs);
            setFilteredReefs(reefs);
        } catch (err) {
            console.error(err);
            setError("Failed to load reef data. Please try uploading manually.");
        } finally {
            setLoading(false);
        }
    };

    // Handle File Upload
    const handleFileUpload = async (file: File) => {
        setLoading(true);
        setError(null);
        try {
            const reefs = await ReefService.parseFile(file);
            setAllReefs(reefs);
        } catch (err) {
            setError("Invalid file format.");
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    useEffect(() => {
        let result = allReefs;

        if (selectedState !== 'All') {
            result = result.filter(r => r.properties.State === selectedState);
        }

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(r =>
                (r.properties.Name || '').toLowerCase().includes(lowerQuery)
            );
        }

        if (selectedCounty !== 'All') {
            // Only filter by county if it matches the current state (or if state is All)
            // Implicitly handled by the dropdown reset, but good safety check
            result = result.filter(r => r.properties.County === selectedCounty);
        }

        if (selectedMaterial !== 'All') {
            result = result.filter(r => r.properties.MatCat === selectedMaterial);
        }

        if (minDepth || maxDepth) {
            const min = minDepth ? parseFloat(minDepth) : -Infinity;
            const max = maxDepth ? parseFloat(maxDepth) : Infinity;

            result = result.filter(r => {
                let depthVal = r.properties.Depth;
                // Handle various depth formats
                if (typeof depthVal === 'string') {
                    // Extract first number found
                    const match = depthVal.match(/(\d+(\.\d+)?)/);
                    depthVal = match ? parseFloat(match[0]) : 0;
                }
                const d = Number(depthVal);
                if (isNaN(d)) return false;
                return d >= min && d <= max;
            });
        }

        setFilteredReefs(result);
    }, [allReefs, searchQuery, selectedState, selectedCounty, selectedMaterial, minDepth, maxDepth]);

    // Unique Options for Selects
    // Update counties to depend on selectedState
    const counties = useMemo(() => {
        let source = allReefs;
        if (selectedState !== 'All') {
            source = source.filter(r => r.properties.State === selectedState);
        }
        return Array.from(new Set(source.map(r => r.properties.County).filter(Boolean))).sort();
    }, [allReefs, selectedState]);

    const materials = useMemo(() =>
        Array.from(new Set(allReefs.map(r => r.properties.MatCat).filter(Boolean))).sort(),
        [allReefs]);

    return {
        allReefs,
        reefs: filteredReefs,
        totalReefs: allReefs.length,
        loading,
        error,
        filters: {
            searchQuery,
            setSearchQuery,
            selectedState,
            setSelectedState,
            selectedCounty,
            setSelectedCounty,
            selectedMaterial,
            setSelectedMaterial,
            counties,
            materials,
            minDepth,
            setMinDepth,
            maxDepth,
            setMaxDepth
        },
        handleFileUpload,
        reload: loadReefs
    };
};
