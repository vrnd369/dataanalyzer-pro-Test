import axios, { AxiosInstance } from 'axios';

// Configuration interfaces
interface ServiceConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  circuitBreaker?: {
    threshold: number;
    resetTimeout: number;
  };
}

interface AnalysisConfig {
  method: string;
  endpoint: string;
  validation?: (data: any) => boolean;
  transform?: (data: any) => any;
  fallback?: (data: any) => any;
}

// Circuit breaker implementation
class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private isOpen: boolean = false;
  private readonly threshold: number;
  private readonly resetTimeout: number;

  constructor(config: { threshold: number; resetTimeout: number }) {
    this.threshold = config.threshold;
    this.resetTimeout = config.resetTimeout;
  }

  check(): boolean {
    const now = Date.now();
    if (this.isOpen) {
      if (now - this.lastFailureTime > this.resetTimeout) {
        this.reset();
        return false;
      }
      return true;
    }
    return false;
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) {
      this.isOpen = true;
    }
  }

  reset(): void {
    this.failures = 0;
    this.isOpen = false;
    this.lastFailureTime = 0;
  }
}

// Dynamic Universal Analytics Service
export class DynamicUniversalAnalytics {
  private readonly axiosInstance: AxiosInstance;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly analysisConfigs: Map<string, AnalysisConfig>;
  private readonly retryAttempts: number;

  constructor(config: ServiceConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 5000,
    });

    this.circuitBreaker = new CircuitBreaker({
      threshold: config.circuitBreaker?.threshold || 3,
      resetTimeout: config.circuitBreaker?.resetTimeout || 30000,
    });

    this.retryAttempts = config.retryAttempts || 3;
    this.analysisConfigs = new Map();
  }

  // Register new analysis method
  registerAnalysis(name: string, config: AnalysisConfig): void {
    this.analysisConfigs.set(name, config);
  }

  // Generic analysis method
  async analyze<T>(name: string, data: any): Promise<T> {
    const config = this.analysisConfigs.get(name);
    if (!config) {
      throw new Error(`Analysis method '${name}' not registered`);
    }

    // Validate data if validation function exists
    if (config.validation && !config.validation(data)) {
      throw new Error(`Invalid data format for ${name} analysis`);
    }

    // Transform data if transform function exists
    const transformedData = config.transform ? config.transform(data) : data;

    // Check circuit breaker
    if (this.circuitBreaker.check()) {
      console.warn(`Circuit breaker is open for ${name}, using fallback`);
      return config.fallback ? config.fallback(data) : this.defaultFallback(data);
    }

    let retryCount = 0;
    while (retryCount <= this.retryAttempts) {
      try {
        const response = await this.axiosInstance.post(config.endpoint, transformedData);
        this.circuitBreaker.reset();
        return response.data;
      } catch (error) {
        console.error(`Error in ${name} analysis:`, error);
        
        // If we have a fallback, use it immediately on error
        if (config.fallback) {
          console.warn(`Using fallback for ${name} analysis`);
          return config.fallback(data);
        }

        if (this.handleError(error, retryCount, name)) {
          retryCount++;
          continue;
        }
        
        // If no fallback and all retries failed, use default fallback
        return this.defaultFallback(data);
      }
    }

    return this.defaultFallback(data);
  }

  private handleError(error: any, retryCount: number, methodName: string): boolean {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const isServerError = status === 500 || status === 502 || status === 503 || status === 504;

      if (isServerError || error.code === 'ERR_NETWORK') {
        this.circuitBreaker.recordFailure();
        
        if (retryCount < this.retryAttempts) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          console.log(`Retrying ${methodName} in ${delay}ms... (Attempt ${retryCount + 1}/${this.retryAttempts})`);
          return true;
        }
      }
    }
    return false;
  }

  private defaultFallback(data: any): any {
    console.warn('Using default fallback implementation');
    if (Array.isArray(data)) {
      // For time series data
      const mean = data.reduce((a, b) => a + b, 0) / data.length;
      const stdDev = Math.sqrt(data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length);
      return {
        trend: {
          direction: mean > data[0] ? 'upward' : 'downward',
          strength: Math.abs(mean - data[0]) / stdDev
        },
        seasonality: {
          strength: 0.5
        },
        ensemble_prediction: {
          value: mean,
          confidence: 0.7
        }
      };
    }
    return {
      status: 'fallback',
      data: data,
      message: 'Using local fallback implementation'
    };
  }

  // Health check
  async checkHealth(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }
}

// Example usage:
const analytics = new DynamicUniversalAnalytics({
  baseUrl: 'http://localhost:8002/api',
  timeout: 10000,
  retryAttempts: 2,
  circuitBreaker: {
    threshold: 2,
    resetTimeout: 15000
  }
});

// Register analysis methods
analytics.registerAnalysis('timeSeries', {
  method: 'POST',
  endpoint: '/advanced/analyze',
  validation: (data) => Array.isArray(data) && data.length >= 2,
  transform: (data) => ({ 
    data: data,
    config: {
      horizon: 5,
      confidence: 0.95,
      sequence_length: 10
    }
  }),
  fallback: (data: number[]) => {
    console.log('Using local time series analysis fallback');
    try {
      // Enhanced local analysis
      const mean = data.reduce((a, b) => a + b, 0) / data.length;
      const stdDev = Math.sqrt(data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length);
      
      // Calculate trend
      const trend = data[data.length - 1] > data[0] ? 'upward' : 'downward';
      const trendStrength = Math.abs(data[data.length - 1] - data[0]) / stdDev;
      
      // Calculate seasonality using autocorrelation
      const seasonalityStrength = calculateSeasonalityStrength(data);
      
      // Calculate prediction with confidence
      const prediction = calculatePrediction(data, mean, stdDev, trend);
      
      return {
        trend: {
          direction: trend,
          strength: Math.min(trendStrength, 1)
        },
        seasonality: {
          strength: seasonalityStrength
        },
        ensemble_prediction: {
          value: prediction.value,
          confidence: prediction.confidence
        }
      };
    } catch (error) {
      console.error('Error in fallback analysis:', error);
      // Return safe default values if fallback also fails
      return {
        trend: {
          direction: 'neutral',
          strength: 0.5
        },
        seasonality: {
          strength: 0.5
        },
        ensemble_prediction: {
          value: data[data.length - 1],
          confidence: 0.5
        }
      };
    }
  }
});

// Helper functions for enhanced local analysis
function calculateSeasonalityStrength(data: number[]): number {
  try {
    const n = data.length;
    if (n < 4) return 0.5;
    
    // Simple autocorrelation for seasonality detection
    const mean = data.reduce((a, b) => a + b, 0) / n;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    
    // Calculate autocorrelation for lag 1
    let autocorr = 0;
    for (let i = 1; i < n; i++) {
      autocorr += (data[i] - mean) * (data[i - 1] - mean);
    }
    autocorr /= (n - 1) * variance;
    
    return Math.min(Math.abs(autocorr), 1);
  } catch (error) {
    console.error('Error calculating seasonality:', error);
    return 0.5;
  }
}

function calculatePrediction(data: number[], mean: number, stdDev: number, trend: string): { value: number; confidence: number } {
  try {
    const lastValue = data[data.length - 1];
    const prediction = trend === 'upward' ? lastValue + stdDev : lastValue - stdDev;
    
    // Calculate confidence based on data stability
    const stability = 1 - (stdDev / mean);
    const confidence = Math.max(0.5, Math.min(stability, 0.9));
    
    return {
      value: prediction,
      confidence
    };
  } catch (error) {
    console.error('Error calculating prediction:', error);
    return {
      value: data[data.length - 1],
      confidence: 0.5
    };
  }
}

analytics.registerAnalysis('anomaly', {
  method: 'POST',
  endpoint: '/detect-anomalies',
  validation: (data) => Array.isArray(data) && data.length >= 2,
  transform: (data) => ({ data, threshold: 0.95 }),
  fallback: (data: number[]) => {
    console.log('Using local anomaly detection fallback');
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const stdDev = Math.sqrt(data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length);
    return {
      anomalies: data.map((value, index) => ({
        index,
        value,
        severity: Math.abs((value - mean) / stdDev) / 3,
        isAnomaly: Math.abs((value - mean) / stdDev) > 3,
        detection_methods: {
          statistical: true,
          isolation_forest: false,
          dbscan: false
        }
      }))
    };
  }
});

analytics.registerAnalysis('correlation', {
  method: 'POST',
  endpoint: '/advanced/correlation',
  validation: (data) => {
    const arrays = Object.values(data);
    return arrays.length >= 2 && arrays.every(arr => Array.isArray(arr) && arr.length > 0);
  }
});

analytics.registerAnalysis('forecast', {
  method: 'POST',
  endpoint: '/advanced/forecast',
  validation: (data) => Array.isArray(data) && data.length >= 2,
  transform: (data) => ({ data, config: { horizon: 10 } })
});

export default analytics; 