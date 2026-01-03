import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listTables() {
  // Querying information_schema is restricted for anon key usually.
  // Instead, let's just try to select from the ones we know or suspect.
  const tables = ['channels', 'categories', 'video_metadata', 'videos'];
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`Table '${table}': NOT FOUND or ACCESS DENIED (${error.message})`);
    } else {
      console.log(`Table '${table}': FOUND (${count} rows)`);
    }
  }
}

listTables();
