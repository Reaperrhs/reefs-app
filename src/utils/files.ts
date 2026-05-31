import type { ReefFeature } from '../types/reef';

export const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const exportToCSV = (reefs: ReefFeature[]) => {
    const headers = ['Name', 'Category', 'Depth', 'Latitude', 'Longitude', 'County', 'Description', 'DeployDate'];
    const rows = reefs.map(reef => {
        const p = reef.properties;
        const [lng, lat] = reef.geometry.coordinates;
        return [
            `"${p.Name || ''}"`,
            `"${p.MatCat || ''}"`,
            `"${p.Depth || ''}"`,
            lat,
            lng,
            `"${p.County || ''}"`,
            `"${p.Description || ''}"`,
            `"${p.DeployDate || ''}"`
        ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
};

export const exportToGPX = (reefs: ReefFeature[]) => {
    const header = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Reefs App" xmlns="http://www.topografix.com/GPX/1/1">`;

    const waypoints = reefs.map(reef => {
        const p = reef.properties;
        const [lng, lat] = reef.geometry.coordinates;
        return `  <wpt lat="${lat}" lon="${lng}">
    <name>${escapeXml(p.Name)}</name>
    <desc>${escapeXml(p.Description || p.MatCat)}</desc>
    <sym>Waypoint</sym>
  </wpt>`;
    }).join('\n');

    const footer = `</gpx>`;
    return `${header}\n${waypoints}\n${footer}`;
};

export const exportToKML = (reefs: ReefFeature[]) => {
    const header = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Exported Reefs</name>`;

    const placemarks = reefs.map(reef => {
        const p = reef.properties;
        const [lng, lat] = reef.geometry.coordinates;
        return `    <Placemark>
      <name>${escapeXml(p.Name)}</name>
      <description>${escapeXml(p.Description || p.MatCat)}</description>
      <Point>
        <coordinates>${lng},${lat},0</coordinates>
      </Point>
    </Placemark>`;
    }).join('\n');

    const footer = `  </Document>
</kml>`;
    return `${header}\n${placemarks}\n${footer}`;
};

const escapeXml = (unsafe: string | undefined): string => {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
        return c;
    });
};
