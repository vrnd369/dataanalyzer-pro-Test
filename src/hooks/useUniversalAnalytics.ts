import { useCallback } from 'react';
import analytics from '../services/universalAnalytics';

export const useUniversalAnalytics = () => {
  const analyzeTimeSeries = useCallback(async (data: number[]) => {
    return analytics.analyze('timeSeries', data);
  }, []);

  const detectAnomalies = useCallback(async (data: number[]) => {
    return analytics.analyze('anomaly', data);
  }, []);

  const analyzeCorrelation = useCallback(async (data: { [key: string]: number[] }) => {
    return analytics.analyze('correlation', data);
  }, []);

  const forecast = useCallback(async (data: number[]) => {
    return analytics.analyze('forecast', data);
  }, []);

  const checkHealth = useCallback(async () => {
    return analytics.checkHealth();
  }, []);

  return {
    analyzeTimeSeries,
    detectAnomalies,
    analyzeCorrelation,
    forecast,
    checkHealth
  };
};

export default useUniversalAnalytics; 