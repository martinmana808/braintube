import { Innertube } from 'youtubei.js';

async function main() {
  const yt = await Innertube.create();
  const info = await yt.getInfo('o-aF4Eee47c');
  console.log("Captions available:", info.captions?.caption_tracks?.map(t => ({ language: t.language_code, name: t.name.text })));
  
  if (info.captions?.caption_tracks?.length > 0) {
     const transcript = await info.getTranscript();
     if (transcript && transcript.transcript && transcript.transcript.content && transcript.transcript.content.body) {
        const segments = transcript.transcript.content.body.initial_segments;
        console.log("First item:", segments[0]?.snippet.text, "offset:", segments[0]?.start_ms);
     }
  }
}
main().catch(console.error);
