import 'leaflet/dist/leaflet.css';
import { Globe, MapPin, Layers, Compass, Ruler, ZoomIn, ZoomOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useRef, lazy, Suspense } from 'react';
import { DataField } from '@/types/data';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Map } from 'leaflet';

// Dynamically import Map components
const MapContainer = lazy(() => import('react-leaflet').then(mod => ({ default: mod.MapContainer })));
const TileLayer = lazy(() => import('react-leaflet').then(mod => ({ default: mod.TileLayer })));
const Marker = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Marker })));
const Popup = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Popup })));
const Circle = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Circle })));

interface SpatialAnalysisProps {
  data: {
    fields: DataField[];
    rows: Record<string, any>[];
  };
}

export const modules = [
  {
    id: 'spatial',
    name: 'Spatial Analysis',
    icon: Globe,
    description: 'Geographic and location-based analysis with interactive maps and spatial metrics',
    available: (data: { fields: DataField[] }) => data.fields.some(f =>
      f.name.toLowerCase().includes('location') ||
      f.name.toLowerCase().includes('lat') ||
      f.name.toLowerCase().includes('lon') ||
      f.name.toLowerCase().includes('address') ||
      f.name.toLowerCase().includes('geo')
    )
  },
];

export function SpatialAnalysisPanel({ data }: SpatialAnalysisProps) {
  const [mapType, setMapType] = useState<'points' | 'heatmap' | 'clusters'>('points');
  const [radius, setRadius] = useState<number>(1000);
  const [latField, setLatField] = useState<string>('');
  const [lngField, setLngField] = useState<string>('');
  const mapRef = useRef<Map | null>(null);
  
  // Calculate spatial metrics
  const calculateMetrics = () => {
    if (!latField || !lngField || !data?.rows || !Array.isArray(data.rows)) {
      return null;
    }
    
    const coordinates = data.rows
      .map(row => {
        const lat = parseFloat(row[latField]);
        const lng = parseFloat(row[lngField]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng];
        }
        return null;
      })
      .filter(coord => coord !== null) as [number, number][];
    
    if (coordinates.length === 0) return null;
    
    // Calculate bounds
    const lats = coordinates.map(c => c[0]);
    const lngs = coordinates.map(c => c[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Calculate center
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // Calculate spread
    const latSpread = maxLat - minLat;
    const lngSpread = maxLng - minLng;
    
    return {
      pointCount: coordinates.length,
      bounds: { minLat, maxLat, minLng, maxLng },
      center: { lat: centerLat, lng: centerLng },
      spread: { lat: latSpread, lng: lngSpread }
    };
  };
  
  const metrics = calculateMetrics();

  console.log('Available fields:', data.fields);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
      {/* Left sidebar with controls */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <span>Spatial Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black-500 mb-1">Latitude Field</label>
                <Select value={latField} onValueChange={setLatField}>
                  <SelectTrigger className="w-full text-black-500">
                    <SelectValue placeholder="Select latitude field" className="bg-grey text-black-500" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.fields
                      .filter(f => f.type === 'number')
                      .map(f => (
                        <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black-500 mb-1">Longitude Field</label>
                <Select value={lngField} onValueChange={setLngField}>
                  <SelectTrigger className="w-full text-black-500">
                    <SelectValue placeholder="Select longitude field" className="text-black-500" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.fields
                      .filter(f => f.type === 'number')
                      .map(f => (
                        <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Visualization Type</label>
                <Tabs value={mapType} onValueChange={(v) => setMapType(v as any)} className="w-full">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="points" className="flex items-center justify-center">
                      <MapPin className="w-4 h-4 mr-1" /> Points
                    </TabsTrigger>
                    <TabsTrigger value="heatmap" className="flex items-center justify-center">
                      <Layers className="w-4 h-4 mr-1" /> Heatmap
                    </TabsTrigger>
                    <TabsTrigger value="clusters" className="flex items-center justify-center">
                      <Compass className="w-4 h-4 mr-1" /> Clusters
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {mapType === 'heatmap' && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Heatmap Radius: {radius} meters
                  </label>
                  <Slider
                    value={[radius]}
                    onValueChange={([val]) => setRadius(val)}
                    min={100}
                    max={5000}
                    step={100}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Spatial metrics card */}
        {metrics && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="w-5 h-5" />
                <span>Spatial Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gray-100 rounded">
                  <div className="text-xs text-gray-500">Points</div>
                  <div className="font-bold">{metrics.pointCount}</div>
                </div>
                <div className="p-2 bg-gray-100 rounded">
                  <div className="text-xs text-gray-500">Lat Spread</div>
                  <div className="font-bold">{metrics.spread.lat.toFixed(4)}°</div>
                </div>
                <div className="p-2 bg-gray-100 rounded">
                  <div className="text-xs text-gray-500">Lng Spread</div>
                  <div className="font-bold">{metrics.spread.lng.toFixed(4)}°</div>
                </div>
                <div className="p-2 bg-gray-100 rounded">
                  <div className="text-xs text-gray-500">Center</div>
                  <div className="font-bold text-xs">
                    {metrics.center.lat.toFixed(4)}, {metrics.center.lng.toFixed(4)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Main map area */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardContent className="p-0 h-[600px]">
            {latField && lngField && metrics ? (
              <Suspense fallback={<div>Loading map...</div>}>
                <MapContainer
                  center={[metrics.center.lat, metrics.center.lng]}
                  zoom={10}
                  scrollWheelZoom={true}
                  className="h-full w-full rounded-b-lg"
                  whenCreated={(map: Map) => {
                    mapRef.current = map;
                  }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Render points or other visualizations */}
                  {mapType === 'points' && data.rows.map((row, idx) => {
                    const coords = [parseFloat(row[latField]), parseFloat(row[lngField])];
                    if (!coords || coords.some(isNaN)) return null;
                    
                    return (
                      <Marker key={idx} position={coords as [number, number]}>
                        <Popup>
                          <div className="text-sm">
                            <div className="font-bold">{latField}</div>
                            <div>Lat: {coords[0].toFixed(4)}</div>
                            <div>Lng: {coords[1].toFixed(4)}</div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                  
                  {mapType === 'heatmap' && (
                    <>
                      {data.rows.map((row, idx) => {
                        const coords = [parseFloat(row[latField]), parseFloat(row[lngField])];
                        if (!coords || coords.some(isNaN)) return null;
                        
                        return (
                          <Circle
                            key={idx}
                            center={coords as [number, number]}
                            radius={radius}
                            fillOpacity={0.5}
                            color="red"
                            fillColor="red"
                          />
                        );
                      })}
                    </>
                  )}
                </MapContainer>
              </Suspense>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-4">
                  <Globe className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium text-gray-900">No geographic data available</h3>
                  <p className="text-gray-500 mt-1">
                    Please select both latitude and longitude fields to visualize the map.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Map controls */}
        {latField && lngField && metrics && (
          <div className="mt-2 flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.flyTo(
                      [metrics.center.lat, metrics.center.lng],
                      10
                    );
                  }
                }}
              >
                <Compass className="w-4 h-4 mr-1" /> Reset View
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.zoomIn();
                  }
                }}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.zoomOut();
                  }
                }}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const SpatialAnalysis = {
  render: (props: SpatialAnalysisProps) => <SpatialAnalysisPanel {...props} />
}; 