import { incrementGroq } from './quota';

export const generateSummary = async (transcript, apiKey) => {
  const isFallback = transcript.includes('[FALLBACK CONTENT]');
  
  let prompt = '';
  if (isFallback) {
    prompt = `The following text is a VIDEO DESCRIPTION because the transcript is currently unavailable.
    TASK: Provide a high-quality summary of what this video is about based on the available description text.
    
    CRITICAL INSTRUCTIONS:
    - IGNORE all promotional links, social media handles, and affiliate disclaimers.
    - If the description describes the video's content, expand on those points.
    - If the description is vague, summarize the topic based on the key technical terms or entities mentioned.
    - Do NOT state you cannot summarize unless the text is literally empty. Reach for any signal of content.
    
    Available Text: ${transcript.substring(0, 5000)}`;
  } else {
    prompt = `Summarize the following YouTube transcript in a detailed, bulleted format. Highlight key takeaways.
    
    Transcript: ${transcript.substring(0, 25000)}`;
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      messages: [{
        role: 'user',
        content: prompt
      }],
      model: 'llama-3.3-70b-versatile'
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to generate summary with Groq');
  }

  const data = await response.json();
  
  // Track Quota
  if (data.usage?.total_tokens) {
    incrementGroq(data.usage.total_tokens);
  }

  return data.choices[0].message.content;
};

export const chatWithVideo = async (transcript, history, question, apiKey) => {
  const isFallback = transcript.includes('[FALLBACK CONTENT]');
  
  const systemPrompt = isFallback 
    ? `You are a helpful assistant. The transcript for this video is currently unavailable, so you are answering based on the video's DESCRIPTION.
       Description: ${transcript.substring(0, 5000)}
       
       TASK: Answer the user's question about the video based on the information provided in the description.
       - Focus on the main topic, creators, and tools mentioned.
       - If you can't find the answer, try to provide relevant context from the description or suggest what the video might cover.
       - BE HELPFUL and avoid saying "the transcript doesn't mention" since we know it's a description.`
    : `You are a helpful assistant answering questions about a YouTube video based on its transcript. 
       Transcript: ${transcript.substring(0, 25000)}
       
       Answer the user's question based on the transcript. If the answer is not directly there, use the context to provide the best possible response.`;

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

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to chat with video using Groq');
  }

  const data = await response.json();

  // Track Quota
  if (data.usage?.total_tokens) {
    incrementGroq(data.usage.total_tokens);
  }

  return data.choices[0].message.content;
};

export const generateTags = async (title, channelTitle, apiKey) => {
  const prompt = `Generate 3-5 relevant hashtags for a YouTube video with the following details:
  Title: "${title}"
  Channel: "${channelTitle}"
  
  Return ONLY the hashtags separated by spaces (e.g., #Tech #AI #Coding). Do not include any other text.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      messages: [{
        role: 'user',
        content: prompt
      }],
      model: 'llama-3.3-70b-versatile'
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to generate tags with Groq');
  }

  const data = await response.json();

  // Track Quota
  if (data.usage?.total_tokens) {
    incrementGroq(data.usage.total_tokens);
  }

  return data.choices[0].message.content.trim().split(' ');
};
