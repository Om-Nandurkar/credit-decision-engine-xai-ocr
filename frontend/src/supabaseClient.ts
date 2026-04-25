import { createClient } from "@supabase/supabase-js";
import { Database } from "./types/supabase";

// 1. Supabase Configuration
const supabaseUrl = import.meta.env.supabaseUrl;
const supabaseKey = import.meta.env.supabaseKey;

// 2. Backend API Configuration
// This will pull from your Vercel/Local .env variable VITE_API_URL
export const apiBaseUrl = import.meta.env.VITE_API_URL;

// Validation for your presentation
if (!supabaseUrl || !apiBaseUrl) {
  console.warn("Environment variables are missing! Backend or Supabase might not connect.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);