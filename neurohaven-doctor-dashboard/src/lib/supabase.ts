import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    console.warn("Supabase URL and Anon Key are missing in .env.local; operating in mock mode.");
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

