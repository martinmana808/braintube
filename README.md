# BrainTube

**BrainTube** is a curated, distraction-free YouTube experience designed for learning and productivity. It allows you to build a personalized feed of high-quality channels, organize them into categories, and leverage AI to summarize and interact with video content.

## Key Features

### 1. Curated Feed
Your feed is organized into three focused columns:
-   **Past 7 Days & Saved**: Catch up on recent uploads from your monitored channels and access your "Saved for Later" library.
-   **Today**: See only the videos released today, keeping you up-to-date without the noise.
-   **System Config**: Manage your channels, categories, and API settings.

### 2. AI Intelligence
BrainTube integrates with Groq's Llama 3 to supercharge your viewing:
-   **Quick Summary**:
    -   **Instant Overview**: Click the **Sparkles icon** on any video card to read a concise, bulleted summary of the video without opening it.
    -   **On-Demand Generation**: If a summary doesn't exist (gray icon), clicking it will generate one instantly.
-   **Chat with Video**:
    -   Open a video and switch to the **CHAT** tab to ask questions about the content. The AI answers based strictly on the video's transcript.

### 3. Organization & Focus
-   **Categories**: Group your channels (e.g., "Tech", "Science", "Music") to filter your feed.
-   **Filters**:
    -   **Duration**: Toggle between `ALL`, `SHORT` (≤ 3 mins), and `LONG` (> 3 mins) videos.
    -   **Search**: Instantly filter videos by title or channel name.
-   **Channel Stats**: Visual indicators in the sidebar show how many videos a channel released **Today** (green) and in the **Past 7 Days** (gray).
-   **Progress Tracking**:
    -   **Mark as Seen**: Hide videos you've watched.
    -   **Saved & Notes**: 
        -   Save interesting videos to the dedicated **Saved Column** (they move out of your main feed).
        -   Add personal **Notes** to any saved video via the video modal.

### 4. Economy & Quota Management
BrainTube employs a "Supabase First" strategy to save on API costs:
-   **Smart Caching**: Fetches are limited to strict 1-hour slots per channel. If data is fresh, it loads from the database (free).
-   **Usage Tracking**: Monitor your daily API economies directly in the header:
    -   **YT**: YouTube Data API units used (limit 10k/day).
    -   **AI**: Groq tokens consumed.

## Getting Started

### 1. Setup
1.  **YouTube API Key**: You need a YouTube Data API key to fetch videos. Enter it in the "System Config" panel.
2.  **Groq API Key**: To use AI features (Summaries & Chat), get a free API key from [console.groq.com](https://console.groq.com) and enter it in the config panel.

### 2. Managing Channels
-   **Add**: Paste a Channel ID, Handle (e.g., `@Veritasium`), or URL into the "Add Channel" box.
-   **Categorize**: Click the category pill next to a channel to assign it to a category.
-   **Solo**: Click the **Eye icon** to focus on a single channel. Click the **Crossed-Eye icon** to return to the full feed.

### 3. Watching & Interacting
-   **Click a video** to open the player.
-   **Summary**: Read the AI-generated summary in the "SUMMARY" tab.
-   **Chat**: Ask questions in the "CHAT" tab.
-   **Quick Summary**: Look for the Sparkles icon on the video card in the main list.

---
*Built for the curious mind.*
