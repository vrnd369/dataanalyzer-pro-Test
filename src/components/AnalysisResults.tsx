import { LineChart, ListChecks, AlertTriangle, CheckCircle } from 'lucide-react';
import { Analysis } from '@/types/analysis';

interface AnalysisResultsProps {
  analysis: Analysis;
}

export default function AnalysisResults({ analysis }: AnalysisResultsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <LineChart className="text-black" />
          <h3 className="text-lg font-semibold text-black">Key Insights</h3>
        </div>
        <ul className="space-y-2">
          {analysis.insights.map((insight, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-black">•</span>
              <span className="text-black">{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="text-black" />
          <h3 className="text-lg font-semibold text-black">Recommendations</h3>
        </div>
        <ul className="space-y-2">
          {analysis.recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-black">•</span>
              <span className="text-black">{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="text-black" />
          <h3 className="text-lg font-semibold text-black">Strengths</h3>
        </div>
        <ul className="space-y-2">
          {analysis.pros.map((pro, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-black">•</span>
              <span className="text-black">{pro}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="text-black" />
          <h3 className="text-lg font-semibold text-black">Areas for Improvement</h3>
        </div>
        <ul className="space-y-2">
          {analysis.cons.map((con, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-black">•</span>
              <span className="text-black">{con}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}