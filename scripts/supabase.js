import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijiubvwctgntofehvccx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaXVidndjdGdudG9mZWh2Y2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwODA0NDUsImV4cCI6MjA1NDY1NjQ0NX0.u-ki5x2mhjKd0DoTeUCMpTkjds91lsUvOjpwSx7IGUw';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 