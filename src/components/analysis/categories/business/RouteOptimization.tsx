import { Card } from '@/components/ui/card';
import type { DataField } from '@/types/data';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock for map library - replace with actual map implementation
const Map = ({ waypoints, optimizedRoute }: { waypoints: any[], optimizedRoute: any[] }) => (
  <div className="h-96 bg-gray-100 rounded-lg relative">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg font-medium text-black">Map Visualization</p>
        <p className="text-sm text-gray-500">
          {waypoints.length} waypoints | {optimizedRoute.length > 0 ? 'Optimized route shown' : 'No optimized route'}
        </p>
      </div>
    </div>
  </div>
);

interface Waypoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface RouteOptimizationProps {
  data: {
    fields: DataField[];
  };
}

export function RouteOptimization({ data }: RouteOptimizationProps) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<any[]>([]);
  const [optimizationMethod, setOptimizationMethod] = useState('time');
  const [newWaypoint, setNewWaypoint] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load sample waypoints if none exist
  useEffect(() => {
    if (waypoints.length === 0) {
      setWaypoints([
        {
          id: '1',
          name: 'Warehouse',
          address: '123 Main St, City',
          lat: 40.7128,
          lng: -74.0060
        },
        {
          id: '2',
          name: 'Customer A',
          address: '456 Oak Ave, Town',
          lat: 40.7328,
          lng: -74.0260
        }
      ]);
    }
  }, []);

  const addWaypoint = () => {
    if (!newWaypoint.trim()) return;
    
    const newPoint: Waypoint = {
      id: Date.now().toString(),
      name: `Point ${waypoints.length + 1}`,
      address: newWaypoint,
      lat: 40.7128 + (Math.random() * 0.02 - 0.01),
      lng: -74.0060 + (Math.random() * 0.02 - 0.01)
    };
    
    setWaypoints([...waypoints, newPoint]);
    setNewWaypoint('');
    inputRef.current?.focus();
  };

  const removeWaypoint = (id: string) => {
    setWaypoints(waypoints.filter(wp => wp.id !== id));
    if (optimizedRoute.length > 0) {
      setOptimizedRoute([]);
    }
  };

  const optimizeRoute = () => {
    if (waypoints.length < 2) {
      alert('You need at least 2 waypoints to optimize a route');
      return;
    }
    
    setIsOptimizing(true);
    
    // Simulate API call
    setTimeout(() => {
      // Mock optimization - in a real app, this would call a routing API
      const optimizedOrder = [...waypoints];
      if (optimizationMethod === 'distance') {
        optimizedOrder.sort((a, b) => a.lat - b.lat);
      } else {
        optimizedOrder.sort((a, b) => a.lng - b.lng);
      }
      
      setOptimizedRoute(optimizedOrder);
      setIsOptimizing(false);
    }, 1500);
  };

  const clearRoute = () => {
    setOptimizedRoute([]);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-black mb-4">Route Optimization</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Map waypoints={waypoints} optimizedRoute={optimizedRoute} />
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-black">
            <div>
              <Label htmlFor="optimizationMethod" className="text-black">Optimization Method</Label>
              <Select 
                value={optimizationMethod} 
                onValueChange={setOptimizationMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time" className="text-black">Fastest Route</SelectItem>
                  <SelectItem value="distance" className="text-black">Shortest Distance</SelectItem>
                  <SelectItem value="balanced" className="text-black">Balanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end space-x-2">
              <Button 
                onClick={optimizeRoute} 
                disabled={isOptimizing || waypoints.length < 2}
                className="flex-1"
              >
                {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
              </Button>
              <Button 
                variant="outline" 
                onClick={clearRoute}
                disabled={optimizedRoute.length === 0}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
        
        <div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newWaypoint" className="text-black">Add Waypoint</Label>
              <div className="flex space-x-2">
                <Input
                  id="newWaypoint"
                  ref={inputRef}
                  value={newWaypoint}
                  onChange={(e) => setNewWaypoint(e.target.value)}
                  placeholder="Enter address"
                  onKeyDown={(e) => e.key === 'Enter' && addWaypoint()}
                />
                <Button onClick={addWaypoint} disabled={!newWaypoint.trim()}>
                  Add
                </Button>
              </div>
            </div>
            
            <div className="border rounded-lg divide-y">
              <h4 className="p-3 font-medium text-black bg-gray-50">Waypoints ({waypoints.length})</h4>
              {waypoints.length === 0 ? (
                <p className="p-3 text-sm text-gray-500">No waypoints added</p>
              ) : (
                <ul className="max-h-96 overflow-y-auto text-black">
                  {waypoints.map((waypoint) => (
                    <li key={waypoint.id} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-black">{waypoint.name}</p>
                        <p className="text-sm text-gray-500">{waypoint.address}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWaypoint(waypoint.id)}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {optimizedRoute.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-black mb-2">Optimized Route Order</h4>
          <ol className="list-decimal pl-5 space-y-1 text-black">
            {optimizedRoute.map((point) => (
              <li key={point.id} className="py-1 text-black">
                {point.name} - {point.address}
              </li>
            ))}
          </ol>
        </div>
      )}
      
      <p className="text-sm text-black mt-4">Analyzing {data.fields.length} data fields.</p>
    </Card>
  );
} 