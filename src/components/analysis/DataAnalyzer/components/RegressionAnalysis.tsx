import React from 'react';

interface RegressionAnalysisProps {
  data?: any;
}

export const RegressionAnalysis: React.FC<RegressionAnalysisProps> = ({ data }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Regression Analysis</h2>
      <div className="space-y-4">
        {data && (
          <div>
            <p>Data available for regression analysis</p>
            <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
        {!data && <p>No data available for regression analysis</p>}
      </div>
    </div>
  );
};

export default RegressionAnalysis; 