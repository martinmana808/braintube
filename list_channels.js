import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkChannels() {
  const { data, error } = await supabase.from('channels').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(`Found ${data.length} channels.`);
  data.forEach(c => {
    console.log(`- ${c.name} (${c.id}): uploads_playlist_id = ${c.uploads_playlist_id}`);
  });
  
  const missing = data.filter(c => !c.uploads_playlist_id);
  if (missing.length > 0) {
    console.log(`\nWARNING: ${missing.length} channels are missing uploads_playlist_id!`);
  } else {
    console.log('\nAll channels have uploads_playlist_id.');
  }
}

checkChannels();
