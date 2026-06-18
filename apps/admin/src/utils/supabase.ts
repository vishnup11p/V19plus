import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwkrncxrxwyvpchfrvdr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'build-time-placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
