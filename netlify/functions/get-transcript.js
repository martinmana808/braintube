import { YoutubeTranscript } from 'youtube-transcript';

const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}]`;
};

export const handler = async (event) => {
  const { videoId } = event.queryStringParameters;

  if (!videoId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing videoId parameter' }),
    };
  }

  try {
    console.log(`Fetching transcript for videoId: ${videoId}`);
    
    let transcriptText = '';
    let descriptionText = '';
    let isFallback = false;

    // 1. Try to get the transcript using youtube-transcript
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      if (transcript && transcript.length > 0) {
        transcriptText = transcript
          .map(segment => `${formatTime(segment.offset)} ${segment.text}`)
          .join('\n');
      }
    } catch (transcriptError) {
      console.log('youtube-transcript error:', transcriptError.message);
    }

    // 2. Fallback to scraping the description if transcript fails
    if (!transcriptText) {
      try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}&hl=en`;
        const response = await fetch(videoUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          }
        });
        const html = await response.text();
        const jsonRegex = /ytInitialPlayerResponse\s*=\s*({.+?});/;
        const match = html.match(jsonRegex);
        
        if (match) {
          const playerResponse = JSON.parse(match[1]);
          descriptionText = playerResponse?.videoDetails?.shortDescription || '';
        }
      } catch (scrapeError) {
        console.log('Scrape fallback error:', scrapeError.message);
      }
    }

    if (!transcriptText && !descriptionText) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No transcript or description found' }),
      };
    }

    const resultText = transcriptText || `[FALLBACK CONTENT]: ${descriptionText}`;
    isFallback = !transcriptText;

    console.log(`Returning content, length: ${resultText.length}. IsFallback: ${isFallback}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        transcript: resultText,
        isFallback: isFallback 
      }),
    };

  } catch (error) {
    console.error('FUNCTION CRASH:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Error', details: error.message }),
    };
  }
};

