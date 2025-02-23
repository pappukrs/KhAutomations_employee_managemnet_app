import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;



const supabaseAnonKey="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1ZWJwd3RtanNxYWRwYWNzZ2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwODA2MDYsImV4cCI6MjA1NDY1NjYwNn0._FjydFNpFkNZYt82BdioWkvQ_14dNNLQQaSWnY3GPEs"
const supabaseUrl="https://fuebpwtmjsqadpacsggi.supabase.co"

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);