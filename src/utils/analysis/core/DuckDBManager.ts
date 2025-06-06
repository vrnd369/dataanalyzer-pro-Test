import { AsyncDuckDB, getJsDelivrBundles, selectBundle, ConsoleLogger } from '@duckdb/duckdb-wasm';
import { tableFromArrays } from 'apache-arrow';
import { DataField } from '@/types/data';
import { createError } from '@/utils/core/error';
import { ErrorType } from '@/utils/core/error';

export class DuckDBManager {
  private static instance: DuckDBManager;
  private db: AsyncDuckDB | null = null;
  private readonly CHUNK_SIZE = 10000;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): DuckDBManager {
    if (!DuckDBManager.instance) {
      DuckDBManager.instance = new DuckDBManager();
    }
    return DuckDBManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.db) return;
    if (this.isInitializing) {
      return this.initPromise || Promise.resolve();
    }

    try {
      this.isInitializing = true;
      this.initPromise = (async () => {
        const JSDELIVR_BUNDLES = await getJsDelivrBundles();
        const bundle = await selectBundle(JSDELIVR_BUNDLES);

        // Create and instantiate the database
        const logger = new ConsoleLogger();
        const worker = new Worker(bundle.mainWorker!);
        
        this.db = new AsyncDuckDB(logger, worker);
        await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);
      })();

      await this.initPromise;
    } catch (error) {
      this.isInitializing = false;
      this.initPromise = null;
      throw createError('SYSTEM_ERROR' as ErrorType, 'Failed to initialize DuckDB');
    } finally {
      this.isInitializing = false;
    }
  }

  async processData(fields: DataField[]): Promise<any> {
    if (!this.db) {
      throw createError('SYSTEM_ERROR' as ErrorType, 'DuckDB not initialized');
    }

    try {
      const conn = await this.db.connect();
      
      // Process data in chunks
      for (let i = 0; i < fields[0].value.length; i += this.CHUNK_SIZE) {
        const chunk = fields.map(field => ({
          name: field.name,
          value: field.value.slice(i, i + this.CHUNK_SIZE)
        }));

        const arrays: Record<string, any[]> = {};
        chunk.forEach(field => {
          arrays[field.name] = field.value;
        });

        const table = tableFromArrays(arrays) as any;
        await conn.insertArrowTable(table, { name: 'data' });
      }

      // Run analysis query
      const result = await conn.query(`
        SELECT 
          *,
          COUNT(*) as count,
          AVG(value) as mean,
          STDDEV(value) as stddev
        FROM data
        GROUP BY name
      `);

      await conn.close();
      return result.toArray();
    } catch (error) {
      throw createError('ANALYSIS_ERROR' as ErrorType, 'Failed to process data with DuckDB');
    }
  }

  async cleanup(): Promise<void> {
    if (this.db) {
      const conn = await this.db.connect();
      await conn.query('DROP TABLE IF EXISTS data');
      await conn.close();
    }
  }
}