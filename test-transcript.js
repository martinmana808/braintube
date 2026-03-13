import { YoutubeTranscript } from 'youtube-transcript';
YoutubeTranscript.fetchTranscript('dQw4w9WgXcQ')
  .then(res => console.log(res.slice(0, 2)))
  .catch(console.error);
