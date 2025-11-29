export const fetchChannelDetails = async (apiKey, identifier) => {
  let params = '';
  
  // Helper to clean input
  const clean = (str) => str.trim();
  const input = clean(identifier);

  // Parse Input
  if (input.includes('youtube.com') || input.includes('youtu.be')) {
    try {
      const url = new URL(input.startsWith('http') ? input : `https://${input}`);
      const path = url.pathname;
      
      if (path.startsWith('/channel/')) {
        params = `id=${path.split('/channel/')[1]}`;
      } else if (path.startsWith('/user/')) {
        params = `forUsername=${path.split('/user/')[1]}`;
      } else if (path.startsWith('/@')) {
        params = `forHandle=${path.split('/')[1]}`; // API expects the @
      } else {
        // Try as handle if it's a root path like youtube.com/@foo
        // If it's just youtube.com/foo, it might be a custom URL, which is hard to resolve without search.
        // We'll assume it's a handle if it starts with @ in the path, otherwise we might fail.
        // Let's try to treat root paths as handles if they don't match known prefixes.
        const potentialHandle = path.slice(1);
        if (potentialHandle.startsWith('@')) {
           params = `forHandle=${potentialHandle}`;
        } else {
           // Fallback: Try as username
           params = `forUsername=${potentialHandle}`;
        }
      }
    } catch (e) {
      throw new Error('Invalid URL format');
    }
  } else {
    // Raw Input
    if (input.startsWith('UC') && input.length === 24) {
      params = `id=${input}`;
    } else if (input.startsWith('@')) {
      params = `forHandle=${input}`;
    } else {
      // Default to username
      params = `forUsername=${input}`;
    }
  }

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&${params}&key=${apiKey}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch channel details');
  }
  
  const data = await response.json();
  
  if (!data.items || data.items.length === 0) {
    // Fallback: Search for the channel
    // Extract a search query from the input
    let query = input;
    if (input.includes('youtube.com') || input.includes('youtu.be')) {
       try {
         const url = new URL(input.startsWith('http') ? input : `https://${input}`);
         // Try to get the last part of the path
         const parts = url.pathname.split('/').filter(p => p);
         query = parts[parts.length - 1];
       } catch (e) {
         // keep query as input
       }
    }

    console.log(`Channel not found via direct lookup. Searching for: ${query}`);
    
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&key=${apiKey}`
    );
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.items && searchData.items.length > 0) {
        const channelId = searchData.items[0].snippet.channelId;
        // Recursive call with ID
        return fetchChannelDetails(apiKey, channelId);
      }
    }

    throw new Error('Channel not found');
  }
  
  const item = data.items[0];
  return {
    id: item.id,
    name: item.snippet.title,
    thumbnail: item.snippet.thumbnails.default.url,
    uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads,
  };
};

export const fetchVideos = async (apiKey, playlistId) => {
  // 1. Fetch Playlist Items
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=10&key=${apiKey}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch videos');
  }
  const data = await response.json();
  
  if (!data.items || data.items.length === 0) return [];

  // 2. Extract Video IDs
  const videoIds = data.items.map(item => item.snippet.resourceId.videoId).join(',');

  // 3. Fetch Video Details (Duration)
  const detailsResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`
  );
  
  let durations = {};
  if (detailsResponse.ok) {
    const detailsData = await detailsResponse.json();
    detailsData.items.forEach(item => {
      durations[item.id] = item.contentDetails.duration;
    });
  }

  // 4. Merge Data
  return data.items.map((item) => {
    const videoId = item.snippet.resourceId.videoId;
    return {
      id: videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      channelId: item.snippet.channelId,
      duration: durations[videoId] || '',
    };
  });
};

export const fetchVideoDetails = async (apiKey, videoIdOrUrl) => {
  let videoId = videoIdOrUrl;
  
  // Extract ID from URL if needed
  if (videoIdOrUrl.includes('youtube.com') || videoIdOrUrl.includes('youtu.be')) {
    try {
      const url = new URL(videoIdOrUrl.startsWith('http') ? videoIdOrUrl : `https://${videoIdOrUrl}`);
      if (url.hostname.includes('youtu.be')) {
        videoId = url.pathname.slice(1);
      } else {
        videoId = url.searchParams.get('v');
      }
    } catch (e) {
      console.error("Invalid URL:", e);
      throw new Error("Invalid video URL");
    }
  }

  if (!videoId) throw new Error("Could not extract video ID");

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch video details');
  }

  const data = await response.json();
  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found');
  }

  const item = data.items[0];
  return {
    id: item.id,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    channelId: item.snippet.channelId,
    duration: item.contentDetails.duration,
  };
};
