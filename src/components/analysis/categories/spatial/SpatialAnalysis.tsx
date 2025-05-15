import { Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { DataField } from '@/types/data';

interface SpatialAnalysisProps {
  data: {
    fields: DataField[];
  };
}

export const modules = [
  {
    id: 'spatial',
    name: 'Spatial Analysis',
    icon: Globe,
    description: 'Geographic and location-based analysis',
    available: (data: { fields: DataField[] }) => data.fields.some(f =>
      f.name.toLowerCase().includes('location') ||
      f.name.toLowerCase().includes('lat') ||
      f.name.toLowerCase().includes('lon')
    )
  },
];

export function SpatialAnalysisPanel({ data }: SpatialAnalysisProps) {
  const [geoFields, setGeoFields] = useState<DataField[]>([]);

  useEffect(() => {
    const filtered = data.fields.filter(f =>
      f.name.toLowerCase().includes('location') ||
      f.name.toLowerCase().includes('lat') ||
      f.name.toLowerCase().includes('lon')
    );
    setGeoFields(filtered);
  }, [data]);

  return (
    <Card className="p-4 m-4">
      <CardContent>
        <h2 className="text-xl font-semibold mb-2 text-black">Spatial Analysis</h2>
        {geoFields.length > 0 ? (
          <ul className="list-disc list-inside text-black">
            {geoFields.map((field, index) => (
              <li key={index} className="text-black">{field.name}</li>
            ))}
          </ul>
        ) : (
          <p className="text-black">No geographic fields detected in the dataset.</p>
        )}
      </CardContent>
    </Card>
  );
}

export const SpatialAnalysis = {
  render: (props: SpatialAnalysisProps) => <SpatialAnalysisPanel {...props} />
}; 