const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
let isMock = false;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("✔ Supabase Client initialized successfully (Cloud Mode)");
  } catch (error) {
    isMock = true;
    console.error("⚠ Supabase initialization failed. Falling back to Mock Developer Mode.", error.message);
  }
} else {
  isMock = true;
  console.log("⚠ Supabase credentials not set in .env. Running in Mock Developer Mode.");
}

module.exports = {
  supabase,
  isMock
};
