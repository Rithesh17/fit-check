/**
 * Supabase Client Setup
 * Configure your Supabase project URL and anon key in .env
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	const errorMsg = '⚠️ Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.';
	console.error(errorMsg);
	throw new Error(errorMsg);
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: false // Since we don't need auth for single user
	}
});
