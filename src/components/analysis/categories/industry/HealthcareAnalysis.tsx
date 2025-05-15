import React from 'react';
import { Activity, Users, Clock } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { HealthcareAnalyzer } from '@/utils/analysis/industry/healthcare';
import { DataField } from '@/types/data';

interface HealthcareAnalysisProps {
  data: {
    fields: DataField[];
  };
}

export function HealthcareAnalysis({ data }: HealthcareAnalysisProps) {
  const patientMetrics = React.useMemo(() => 
    HealthcareAnalyzer.analyzePatientMetrics(data.fields),
    [data.fields]
  );

  const treatmentEffectiveness = React.useMemo(() => 
    HealthcareAnalyzer.analyzeTreatmentEffectiveness(data.fields),
    [data.fields]
  );

  return (
    <div className="space-y-6">
      {/* Patient Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-teal-600" />
            <h4 className="font-medium text-black">Avg. Length of Stay</h4>
          </div>
          <p className="text-2xl font-semibold text-black">{patientMetrics.avgLengthOfStay} days</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-teal-600" />
            <h4 className="font-medium text-black">Readmission Rate</h4>
          </div>
          <p className="text-2xl font-semibold text-black">{(patientMetrics.readmissionRate * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-teal-600" />
            <h4 className="font-medium text-black">Patient Satisfaction</h4>
          </div>
          <p className="text-2xl font-semibold text-black">{(patientMetrics.satisfactionScore * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Patient Flow Chart */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h4 className="font-medium mb-4 text-black">Patient Flow</h4>
        <Line
          data={{
            labels: patientMetrics.flowData.map(d => d.date),
            datasets: [{
              label: 'Patient Volume',
              data: patientMetrics.flowData.map(d => d.volume),
              borderColor: '#0d9488',
              tension: 0.4
            }]
          }}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }}
        />
      </div>

      {/* Treatment Effectiveness */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h4 className="font-medium mb-4 text-black">Treatment Effectiveness</h4>
        <div className="space-y-4">
          {treatmentEffectiveness.map((treatment, index) => (
            <div key={index} className="border-b pb-4 last:border-0">
              <div className="flex justify-between items-center mb-2">
                <h5 className="font-medium text-black">{treatment.name}</h5>
                <span className="text-sm text-teal-600">
                  {(treatment.successRate * 100).toFixed(1)}% Success Rate
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Successful</p>
                  <p className="font-medium text-black">{treatment.outcomes.successful}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Partial</p>
                  <p className="font-medium text-black">{treatment.outcomes.partial}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Unsuccessful</p>
                  <p className="font-medium text-black">{treatment.outcomes.unsuccessful}%</p>
                </div>
              </div>
              {treatment.recommendations && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 text-black">Recommendations:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {treatment.recommendations.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 