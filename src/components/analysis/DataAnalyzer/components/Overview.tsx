import React from 'react';

interface OverviewProps {
  data?: any;
}

export const Overview: React.FC<OverviewProps> = ({ data }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold text-black  mb-4">Data Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data && (
          <div className="bg-white p-4 rounded-lg shadow text-black">
            <p className="text-gray-600 text-black">Data loaded: {typeof data === 'object' ? 'Yes' : 'No'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview; 