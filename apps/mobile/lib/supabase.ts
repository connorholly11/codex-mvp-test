import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@purpose/api-client';

// Hardcoded for local Expo Go development
const supabaseUrl = 'https://qovxpxqozlcsvynmtham.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvdnhweHFvemxjc3Z5bm10aGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTI4NjcsImV4cCI6MjA3NTUyODg2N30.Ssu3GWZbQQqKgoMEiC2em1YAQmHBqhKKL2NaBOllWE8';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
