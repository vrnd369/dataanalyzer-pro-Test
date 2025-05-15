import React from 'react';

interface VisualizationsProps {
  data?: any;
}

export const Visualizations: React.FC<VisualizationsProps> = ({ data }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Data Visualizations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data && (
          <div className="col-span-full">
            <p>Data available for visualization</p>
            {/* Visualization components will be added here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default Visualizations; 