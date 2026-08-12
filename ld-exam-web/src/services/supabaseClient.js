import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cvunxlxtqyuklzxgyivv.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2dW54bHh0cXl1a2x6eGd5aXZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MDcxNjEsImV4cCI6MjEwMjA4MzE2MX0.Uym8k5AsgZOfJIY-SXGM_XFe5_IcivM9II9DVyiCilY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
