import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://zloybmlteeihnvpabuuy.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsb3libWx0ZWVpaG52cGFidXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1Njk1MjksImV4cCI6MjEwNTE0NTUyOX0.AdI9tzZLeOagDUCFpIxxNlYuIwTUEZ5LzneQL5MFsxQ";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);