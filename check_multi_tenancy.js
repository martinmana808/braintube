import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkMetadataSchema() {
  const fakeChannel = {
    id: 'test_channel_id',
    name: 'Test',
    user_id: '11111111-1111-1111-1111-111111111111'
  };
  
  const { error: err1 } = await supabase.from('channels').insert([fakeChannel]);
  console.log('Channel Insert 1:', err1 ? err1.message : 'Success');

  const fakeChannel2 = {
    id: 'test_channel_id', // same ID
    name: 'Test 2',
    user_id: '22222222-2222-2222-2222-222222222222'
  };
  const { error: err2 } = await supabase.from('channels').insert([fakeChannel2]);
  console.log('Channel Insert 2:', err2 ? err2.message : 'Success');

  const fakeVideo = {
    video_id: 'test_video_id',
    user_id: '11111111-1111-1111-1111-111111111111',
    seen: true
  };
  const { error: err3 } = await supabase.from('video_metadata').insert([fakeVideo]);
  console.log('Video Insert 1:', err3 ? err3.message : 'Success');

  const fakeVideo2 = {
    video_id: 'test_video_id', // same ID
    user_id: '22222222-2222-2222-2222-222222222222',
    seen: true
  };
  const { error: err4 } = await supabase.from('video_metadata').insert([fakeVideo2]);
  console.log('Video Insert 2:', err4 ? err4.message : 'Success');
}

checkMetadataSchema();
