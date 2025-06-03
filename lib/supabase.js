import { createClient } from "@supabase/supabase-js";
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL:', SUPABASE_URL ? 'Set' : 'Not set');
console.log('Supabase Key:', SUPABASE_ANON_KEY ? 'Set' : 'Not set');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
