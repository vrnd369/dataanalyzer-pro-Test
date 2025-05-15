import React from 'react';

interface StatRowProps {
  label: string;
  value: string;
}

export const StatRow: React.FC<StatRowProps> = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-black">{label}</span>
      <span className="font-medium text-black">{value}</span>
    </div>
  );
};