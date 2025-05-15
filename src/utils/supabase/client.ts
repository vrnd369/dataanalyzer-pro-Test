import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const STORAGE_BUCKET = 'secure-datasets';

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-client-info': 'dataanalyzer-pro'
      }
    }
  }
);

// Initialize storage bucket
export const initializeStorage = async () => {
  const { error } = await supabase.storage.getBucket(STORAGE_BUCKET);
  
  if (error && error.message.includes('does not exist')) {
    await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: false,
      allowedMimeTypes: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      fileSizeLimit: 500000000 // 500MB
    });
  }
};

// Initialize storage on app start
initializeStorage().catch(console.error);