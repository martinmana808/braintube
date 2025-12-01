import { Innertube } from 'youtubei.js';

export const handler = async (event, context) => {
  const { videoId } = event.queryStringParameters;

  if (!videoId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing videoId parameter' }),
    };
  }

  try {
    const youtube = await Innertube.create();
    const info = await youtube.getInfo(videoId);
    const transcriptData = await info.getTranscript();

    if (!transcriptData || !transcriptData.transcript) {
       return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No transcript found for this video' }),
      };
    }

    const text = transcriptData.transcript.content.body.initial_segments
      .map(seg => seg.snippet.text)
      .join(' ');

    return {
      statusCode: 200,
      body: JSON.stringify({ transcript: text }),
    };
  } catch (error) {
    console.error('Error fetching transcript:', error);
    
    if (error.message && error.message.includes('Transcript panel not found')) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No transcript found for this video' }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch transcript', details: error.message }),
    };
  }
};
