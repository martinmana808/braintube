export const handler = async (event, context) => {
  const { videoId } = event.queryStringParameters;

  if (!videoId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing videoId parameter' }),
    };
  }

  try {
    console.log(`Deep scraping for videoId: ${videoId}`);
    
    // 1. Fetch the video watch page and CAPTURE COOKIES
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}&hl=en`;
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });
    
    const html = await response.text();
    const cookies = response.headers.get('set-cookie'); // Get the session cookies
    
    // 2. Extract metadata and tracks
    const jsonRegex = /ytInitialPlayerResponse\s*=\s*({.+?});/;
    const match = html.match(jsonRegex);
    
    let transcriptText = '';
    let descriptionText = '';
    
    if (match) {
      const playerResponse = JSON.parse(match[1]);
      descriptionText = playerResponse?.videoDetails?.shortDescription || '';
      const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      
      if (captionTracks && captionTracks.length > 0) {
        const track = captionTracks.find(t => t.languageCode === 'en') || captionTracks[0];
        console.log(`Found track: ${track.name.simpleText}`);
        
        try {
          // 3. Fetch transcript using the SESSION COOKIES
          const transcriptRes = await fetch(track.baseUrl + '&fmt=json3', {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
              'Cookie': cookies || '', // Pass cookies back
              'Referer': videoUrl
            }
          });
          
          if (transcriptRes.ok) {
            const transcriptJson = await transcriptRes.json();
            transcriptText = (transcriptJson.events || [])
              .filter(event => event.segs)
              .map(event => event.segs.map(seg => seg.utf8).join(''))
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
          } else {
             console.log(`Transcript API returned ${transcriptRes.status}`);
          }
        } catch (e) {
          console.log('Transcript fetch error:', e.message);
        }
      }
    }

    if (!transcriptText && !descriptionText) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No data found' }),
      };
    }

    // Acknowledge if fallback
    const resultText = transcriptText || `[FALLBACK CONTENT]: ${descriptionText}`;
    console.log(`Returning content, length: ${resultText.length}. IsFallback: ${!transcriptText}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        transcript: resultText,
        isFallback: !transcriptText 
      }),
    };

  } catch (error) {
    console.error('SCRAPER CRASH:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Error', details: error.message }),
    };
  }
};
