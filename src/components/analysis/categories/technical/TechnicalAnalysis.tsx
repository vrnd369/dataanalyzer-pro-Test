import { Cpu, Database, Server, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { DataField } from '@/types/data';

interface TechnicalAnalysisProps {
  data: {
    fields: DataField[];
    metadata?: {
      dataSize?: number;
      nullValues?: number;
      processingTime?: number;
      uptime?: number;
      errorRate?: number;
    };
  };
}

export function TechnicalAnalysis({ data }: TechnicalAnalysisProps) {
  // Calculate metrics based on input data
  const calculateMetrics = () => {
    const totalFields = data.fields.length;
    const fieldsWithIssues = data.fields.filter(
      field => !field.type || !field.name || (field.nullPercentage ?? 0) > 5
    ).length;
    
    const dataQualityScore = totalFields > 0 
      ? Math.max(0, 100 - (fieldsWithIssues / totalFields * 100)) 
      : 0;
    
    const completenessScore = data.metadata?.dataSize && data.metadata.nullValues
      ? 100 - (data.metadata.nullValues / data.metadata.dataSize * 100)
      : 85; // Default if no metadata
    
    const systemPerformance = data.metadata?.uptime || 95; // Default 95% if not provided
    const processingEfficiency = data.metadata?.processingTime
      ? Math.min(100, Math.max(0, 100 - (data.metadata.processingTime / 1000 * 10)))
      : 80; // Default 80% if not provided
    
    return {
      dataQuality: Math.round(Math.min(100, (dataQualityScore * 0.6 + completenessScore * 0.4))),
      systemPerformance: Math.round(systemPerformance),
      processingEfficiency: Math.round(processingEfficiency),
      issuesCount: fieldsWithIssues,
      errorRate: data.metadata?.errorRate || 0
    };
  };

  const metrics = calculateMetrics();
  
  // Generate dynamic recommendations based on analysis
  const generateRecommendations = () => {
    const recommendations = [];
    
    // Data quality recommendations - more granular
    if (metrics.dataQuality < 70) {
      recommendations.push({
        icon: <AlertCircle className="w-4 h-4 text-red-500" />,
        text: "Critical data quality issues detected - immediate attention required",
        priority: 1
      });
    } 
    else if (metrics.dataQuality < 85) {
      recommendations.push({
        icon: <Database className="w-4 h-4 text-amber-500" />,
        text: "Moderate data quality issues - review data collection processes",
        priority: 2
      });
    }
    else if (metrics.dataQuality < 95) {
      recommendations.push({
        icon: <Database className="w-4 h-4 text-teal-600" />,
        text: "Minor data quality opportunities - consider field-level validation",
        priority: 3
      });
    }

    // Field-specific issues
    const problematicFields = data.fields.filter(
      field => (!field.name || !field.type || (field.nullPercentage || 0) > 10)
    );
    
    if (problematicFields.length > 0) {
      const topIssueFields = problematicFields.slice(0, 3);
      recommendations.push({
        icon: <AlertCircle className="w-4 h-4 text-amber-500" />,
        text: `Review ${topIssueFields.length} problematic fields (${topIssueFields.map(f => f.name || 'unnamed').join(', ')})`,
        priority: problematicFields.length > 5 ? 1 : 2
      });
    }

    // System performance - more nuanced
    if (metrics.systemPerformance < 95) {
      recommendations.push({
        icon: <Server className="w-4 h-4 text-red-500" />,
        text: `Server reliability needs improvement (${metrics.systemPerformance}% uptime)`,
        priority: 1
      });
    } 
    else if (metrics.systemPerformance < 99) {
      recommendations.push({
        icon: <Server className="w-4 h-4 text-amber-500" />,
        text: `Server stability good but could be improved (${metrics.systemPerformance}% uptime)`,
        priority: 2
      });
    }

    // Processing efficiency - dynamic thresholds
    if (metrics.processingEfficiency < 70) {
      recommendations.push({
        icon: <Cpu className="w-4 h-4 text-red-500" />,
        text: "Processing is highly inefficient - investigate bottlenecks",
        priority: 1
      });
    } 
    else if (metrics.processingEfficiency < 85) {
      recommendations.push({
        icon: <Cpu className="w-4 h-4 text-amber-500" />,
        text: "Processing has optimization opportunities",
        priority: 2
      });
    }

    // Error rate specific recommendations
    if (metrics.errorRate > 5) {
      recommendations.push({
        icon: <AlertCircle className="w-4 h-4 text-red-500" />,
        text: `High error rate detected (${metrics.errorRate.toFixed(1)}%) - investigate immediately`,
        priority: 1
      });
    }
    else if (metrics.errorRate > 1) {
      recommendations.push({
        icon: <AlertCircle className="w-4 h-4 text-amber-500" />,
        text: `Moderate error rate (${metrics.errorRate.toFixed(1)}%) - monitor closely`,
        priority: 2
      });
    }

    // Add positive feedback when appropriate
    if (metrics.dataQuality >= 95 && metrics.systemPerformance >= 99 && metrics.processingEfficiency >= 90) {
      recommendations.push({
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        text: "Infrastructure is performing excellently",
        priority: 4
      });
    }
    else if (recommendations.length === 0) {
      recommendations.push({
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        text: "No critical issues detected",
        priority: 4
      });
    }

    // Only add monitoring suggestion if there are actual performance issues
    if (metrics.systemPerformance < 99 || metrics.processingEfficiency < 85 || metrics.errorRate > 1) {
      recommendations.push({
        icon: <TrendingUp className="w-4 h-4 text-teal-600" />,
        text: "Enhanced monitoring could help identify issues faster",
        priority: 3
      });
    }

    // Sort by priority (lower numbers first)
    return recommendations.sort((a, b) => a.priority - b.priority);
  };

  const recommendations = generateRecommendations();
  
  // Determine health status
  const getHealthStatus = (value: number) => {
    if (value >= 90) return 'text-green-600';
    if (value >= 75) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Cpu className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-semibold">Technical Analysis</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-teal-600" />
              <h4 className="font-medium">Data Quality</h4>
            </div>
            <p className={`text-2xl font-semibold ${getHealthStatus(metrics.dataQuality)}`}>
              {metrics.dataQuality}%
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {metrics.dataQuality >= 90 ? 'Excellent' : metrics.dataQuality >= 75 ? 'Good' : 'Needs improvement'}
            </p>
            {data.metadata?.nullValues && (
              <p className="text-xs text-gray-400 mt-1">
                {data.metadata.nullValues} null values detected
              </p>
            )}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-5 h-5 text-teal-600" />
              <h4 className="font-medium text-black">System Performance</h4>
            </div>
            <p className={`text-2xl font-semibold text-black ${getHealthStatus(metrics.systemPerformance)}`}>
              {metrics.systemPerformance}%
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {metrics.systemPerformance >= 99 ? 'Optimal' : metrics.systemPerformance >= 95 ? 'Stable' : 'Unstable'}
            </p>
            {metrics.errorRate > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Error rate: {metrics.errorRate.toFixed(2)}%
              </p>
            )}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-5 h-5 text-teal-600" />
              <h4 className="font-medium text-black">Processing Efficiency</h4>
            </div>
            <p className={`text-2xl font-semibold text-black ${getHealthStatus(metrics.processingEfficiency)}`}>
              {metrics.processingEfficiency}%
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {metrics.processingEfficiency >= 85 ? 'Efficient' : metrics.processingEfficiency >= 70 ? 'Adequate' : 'Inefficient'}
            </p>
            {data.metadata?.processingTime && (
              <p className="text-xs text-gray-400 mt-1">
                Avg. processing: {data.metadata.processingTime}ms
              </p>
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <h4 className="font-medium mb-3 text-black">Technical Recommendations</h4>
          <ul className="space-y-3">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                <span className="mt-0.5">{rec.icon}</span>
                <span className="text-sm text-gray-700">{rec.text}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {data.fields.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-3 text-black">Field Analysis Summary</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-50 rounded-lg">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="p-3">Field Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Null %</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.fields.slice(0, 5).map((field, index) => (
                    <tr key={index} className="text-sm border-b last:border-0">
                      <td className="p-3">{field.name || 'Unnamed'}</td>
                      <td className="p-3">{field.type || 'Unknown'}</td>
                      <td className="p-3">
                        {(field.nullPercentage ?? 0).toFixed(1)}%
                      </td>
                      <td className="p-3">
                        {(!field.name || !field.type || ((field.nullPercentage ?? 0) > 5)) ? (
                          <span className="text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" /> Needs review
                          </span>
                        ) : (
                          <span className="text-green-500 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.fields.length > 5 && (
                <p className="text-xs text-gray-500 mt-2">
                  Showing 5 of {data.fields.length} fields. {data.fields.length - 5} more fields analyzed.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 