import React from 'react';
import { BarChart } from 'lucide-react';
import { DataField } from '@/types/data';
import { Chart } from '@/components/ui';

interface VisualizationsProps {
  data: {
    fields: DataField[];
  };
}

export const Visualizations: React.FC<VisualizationsProps> = ({ data }) => {
  const numericFields = data.fields.filter(f => f.type === 'number');

  if (numericFields.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <BarChart className="w-5 h-5 text-black-600" />
        <h3 className="text-lg font-semibold text-black">Data Visualizations</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {numericFields.map(field => (
          <Chart key={field.name} field={field} />
        ))}
      </div>

      <p className="text-sm text-black">profile_pic</p>
      <p className="text-sm text-black">length_username</p>
      <p className="text-sm text-black">fullname_words</p>
      <p className="text-sm text-black">length_fullname</p>
      <p className="text-sm text-black">username</p>
      <p className="text-sm text-black">description_length</p>
      <p className="text-sm text-black">external_URL</p>
      <p className="text-sm text-black">private</p>
      <p className="text-sm text-black">posts</p>
      <p className="text-sm text-black">followers</p>
      <p className="text-sm text-black">follows</p>
      <p className="text-sm text-black">fake</p>
    </div>
  );
};