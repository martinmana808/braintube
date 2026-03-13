import { YoutubeTranscript } from 'youtube-transcript';

async function test() {
  try {
    const list = await YoutubeTranscript.listTranscripts('dQw4w9WgXcQ');
    console.log('Available transcripts:', list);
    
    const transcript = await YoutubeTranscript.fetchTranscript('dQw4w9WgXcQ');
    console.log('First 2 segments:', JSON.stringify(transcript.slice(0, 2), null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
