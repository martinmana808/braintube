
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const videoId = '7ylRUF2uEpA';
  console.log(`Checking metadata for ${videoId}...`);
  const { data, error } = await supabase
    .from('video_metadata')
    .select('summary, tags')
    .eq('video_id', videoId);
    
  if (error) {
    console.error('Error with specific query:', error);
  } else {
    console.log('Specific query success. Data:', data);
  }
  
  // Also try to list ALL data to see if anything exists
  const { data: allData } = await supabase.from('video_metadata').select('*');
  console.log('All data rows:', allData?.length || 0);
}

checkSchema();
