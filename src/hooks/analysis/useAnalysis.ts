import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { DataField } from '../../types/data';
import type { AnalyzedData } from '@/types/analysis';
import { createError } from '../../utils/core/error';
import { AnalysisEngine } from '../../utils/analysis/core/AnalysisEngine';

export function useAnalysis() {
  const [error, setError] = useState<Error | null>(null);
  const [results, setResults] = useState<AnalyzedData | null>(null);
  const [progress, setProgress] = useState(0);
  const engineRef = useRef<AnalysisEngine | null>(null);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);

  const workers: Worker[] = [];
  const MAX_WORKERS = navigator.hardwareConcurrency || 4;
  const MEMORY_CHECK_INTERVAL = 1000; // Check memory every second

  const analysisMutation = useMutation({
    mutationFn: async ({ fields, category }: { fields: DataField[], category?: string }) => {
      setProgress(10); // Initial progress
      engineRef.current = new AnalysisEngine(fields);
      
      // Create workers up to MAX_WORKERS limit
      const numWorkers = Math.min(fields.length, MAX_WORKERS);
      for (let i = 0; i < numWorkers; i++) {
        const worker = new Worker(new URL('../../utils/analysis/worker.ts', import.meta.url));
        workers.push(worker);
      }
      
      setProgress(30); // Engine initialized
      const result = await engineRef.current.analyze(category);
      
      setProgress(100); // Analysis complete
      return result;
    },
    onSuccess: (data) => {
      setResults(data as unknown as AnalyzedData);
    },
    onError: (err) => {
      setError(err instanceof Error ? err : createError('ANALYSIS_ERROR', 'Analysis failed'));
    }
  });

  // Monitor memory usage
  useEffect(() => {
    if (!analysisMutation.isPending) return;

    const interval = setInterval(async () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usageInMB = Math.round(memory.usedJSHeapSize / (1024 * 1024));
        setMemoryUsage(usageInMB);

        // Force garbage collection if memory usage is too high
        if (usageInMB > 500) { // 500MB threshold
          workers.forEach(worker => worker.terminate());
          workers.length = 0;
          global.gc?.();
        }
      }
    }, MEMORY_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [analysisMutation.isPending]);

  return {
    isAnalyzing: analysisMutation.isPending,
    error,
    results,
    progress,
    memoryUsage,
    analyze: (fields: DataField[], category?: string) => analysisMutation.mutate({ fields, category }),
    reset: analysisMutation.reset
  };
}