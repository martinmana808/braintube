# BrainTube Forensic Logs

<a name="log-20251223-ai-investigation"></a>
## [2025-12-23] Investigating AI Functionality

**User Prompt:** we implemented an ai functionality. I dont know if it is working, but it did at some point. Can you please tell me what we implemented and how? i need to implem,ent it in a new project

**Artifact: AI Implementation Guide**

# AI Functionality Implementation Guide

This guide documents the AI functionality implemented in **BrainTube** (Summaries & Chat with Video) and how to replicate it in a new project.

## 1. Architecture Overview

The feature consists of two main parts:
1.  **Backend (Transcript Fetching)**: A serverless function (Netlify Function) that fetches the YouTube video transcript using the `youtubei.js` library. This is necessary to avoid CORS issues and leverage the InnerTube API.
2.  **Frontend (AI Processing)**: A React service that sends the transcript to Groq's API (Llama 3 model) to generate summaries or answer chat questions.

## 2. Dependencies

You will need the following packages in your new project:

**Backend (Server/Functions):**
- `youtubei.js`: To fetch transcripts.

**Frontend:**
- standard `fetch` API.
- (Optional) `react-markdown` to render the AI response.

## 3. Implementation Steps

### Step A: Backend - Transcript Fetcher

Create a serverless function (or API route). In BrainTube, this is a Netlify Function at `netlify/functions/get-transcript.js`.

**File:** `netlify/functions/get-transcript.js`
```javascript
import { Innertube } from 'youtubei.js';

export const handler = async (event, context) => {
  const { videoId } = event.queryStringParameters;

  if (!videoId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing videoId' }) };
  }

  try {
    const youtube = await Innertube.create({
        fetch: (input, init) => fetch(input, init)
    });
    const info = await youtube.getInfo(videoId);
    const transcriptData = await info.getTranscript();

    if (!transcriptData || !transcriptData.transcript) {
       return { statusCode: 404, body: JSON.stringify({ error: 'No transcript found' }) };
    }

    // Combine segments into one text
    const text = transcriptData.transcript.content.body.initial_segments
      .map(seg => seg.snippet.text)
      .join(' ');

    return {
      statusCode: 200,
      body: JSON.stringify({ transcript: text }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch transcript', details: error.message }),
    };
  }
};
```

### Step B: Frontend - AI Service

Create a service to communicate with Groq.

**File:** `src/services/ai.js`
```javascript
export const generateSummary = async (transcript, apiKey) => {
  const prompt = `Summarize the following YouTube video transcript in a concise, bulleted format. Highlight the key takeaways. \n\nTranscript: ${transcript.substring(0, 25000)}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile'
    })
  });

  if (!response.ok) throw new Error('Failed to generate summary');
  const data = await response.json();
  return data.choices[0].message.content;
};

export const chatWithVideo = async (transcript, history, question, apiKey) => {
  const systemPrompt = `You are a helpful assistant that answers questions about a YouTube video based on its transcript. 
  Answer the user's question based ONLY on the transcript provided.
  Transcript: ${transcript.substring(0, 25000)}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: question }
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      messages,
      model: 'llama-3.3-70b-versatile'
    })
  });

  if (!response.ok) throw new Error('Failed to chat');
  const data = await response.json();
  return data.choices[0].message.content;
};
```

### Step C: Integration

In your UI component (e.g., `VideoModal`):

1.  **Fetch Transcript**: Call your backend endpoint (e.g., `fetch('/.netlify/functions/get-transcript?videoId=' + id)`).
2.  **Call AI**: Pass the transcript and the user's Groq API key to `generateSummary` or `chatWithVideo`.
3.  **Display**: Show the result.

```javascript
// Example usage
const setupAI = async (videoId, apiKey) => {
  // 1. Get Transcript
  const tResponse = await fetch(`/.netlify/functions/get-transcript?videoId=${videoId}`);
  const { transcript } = await tResponse.json();

  // 2. Generate Summary
  const summary = await generateSummary(transcript, apiKey);
  console.log(summary);
}
```
