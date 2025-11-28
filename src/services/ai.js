
export const generateSummary = async (transcript, apiKey) => {
  const prompt = `Summarize the following YouTube video transcript in a concise, bulleted format. Highlight the key takeaways. \n\nTranscript: ${transcript.substring(0, 25000)}`;

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
  return data.choices[0].message.content;
};

export const chatWithVideo = async (transcript, history, question, apiKey) => {
  const systemPrompt = `You are a helpful assistant that answers questions about a YouTube video based on its transcript. 
  Here is the transcript:
  ${transcript.substring(0, 25000)}
  
  Answer the user's question based ONLY on the transcript provided. If the answer is not in the transcript, say so.`;

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
  return data.choices[0].message.content.trim().split(' ');
};
