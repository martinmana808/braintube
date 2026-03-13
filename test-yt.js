import { Innertube, UniversalCache } from 'youtubei.js';

async function main() {
  const yt = await Innertube.create({
    cache: new UniversalCache(false)
  });
  const info = await yt.getInfo('o-aF4Eee47c');
  const transcriptData = await info.getTranscript();
  
  if (transcriptData && transcriptData.transcript) {
    console.log(transcriptData.transcript.content.body.initial_segments.slice(0, 3));
  } else {
    console.log("No transcript info found with youtubei.js either.");
  }
}

main().catch(console.error);
