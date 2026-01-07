# AI Implementation in BrainTube
**Date:** 2026-01-07
**Context:** Explanation for replicating AI features in a new application.

## 1. The Core Architecture
The AI functionality consists of two distinct layers:
1.  **Data Extraction (The Eyes):** Getting the text content (transcript) from a YouTube video.
2.  **Intelligence (The Brain):** Processing that text using a Large Language Model (LLM).

---

## 2. What We Are Using

### A. The "Brain" (AI Provider)
We are using **Groq** as our AI inference provider.
*   **Model:** `llama-3.3-70b-versatile`
*   **Why Groq?** It is essentially "Llama at light speed." It offers extremely low latency (near instant) which is critical for user experience, and it is significantly cheaper than OpenAI.
*   **Alternative Options for your new app:**
    *   **OpenAI (GPT-4o):** Better reasoning, higher cost, slower.
    *   **Anthropic (Claude 3.5 Sonnet):** Best coding/reasoning capabilities, moderate speed.
    *   **DeepSeek:** Very cheap, good performance, but data privacy considerations differ.

### B. The "Eyes" (Data Source)
We are using a **Custom Serverless Scraper** hosted on Netlify Functions.
*   **Technique:** "Deep Scraping" with Cookie Session.
*   **Why?** Public libraries like `youtubei.js` or `youtube-transcript` often get blocked (403/429 errors) by YouTube's bot detection. Our custom implementation mimics a real browser session by capturing cookies from the video page before requesting the transcript.

---

## 3. How It Is Implemented

### Step 1: Backend - The Transcript Fetcher
**File:** `netlify/functions/get-transcript.js`

This is a serverless function that acts as a proxy. We do not call YouTube directly from the frontend (React) to avoid CORS errors and IP blocks.

**The Workflow:**
1.  **Initial Handshake:** The function requests the actual YouTube video page (`www.youtube.com/watch?v=...`) to get a valid session and cookies.
2.  **Extraction:** It parses the HTML to find the `playerCaptionsTracklistRenderer` inside the `ytInitialPlayerResponse` object.
3.  **Authentication:** It uses the cookies captured in Step 1 to make an authenticated request to the caption track URL.
4.  **Fallback:** If no transcript is found (or it's a generated track that fails), it extracts the `shortDescription` of the video as a fallback data source.

### Step 2: Frontend - The AI Service
**File:** `src/services/ai.js`

This service handles the communication with the Groq API.

**The Workflow:**
1.  **Prompt Engineering:**
    *   We dynamically construct a prompt based on whether we have a real transcript or just a description (fallback).
    *   *Example Prompt:* "Summarize the following YouTube transcript in a detailed, bulleted format..."
2.  **Context Window Management:**
    *   We truncate the text (e.g., `substring(0, 25000)`) to ensure we don't exceed the model's token limit.
3.  **API Call:**
    *   It sends a `POST` request to `https://api.groq.com/openai/v1/chat/completions`.
    *   It uses the standard OpenAI-compatible JSON schema (messages array), making it easy to plug in other providers (like OpenAI or DeepSeek) just by changing the URL and API Key.

### Step 3: Contextual Chat (RAG-lite)
**Feature:** "Chat with Video"
*   This is not a full RAG (Retrieval Augmented Generation) with vector databases.
*   Instead, we pass the **entire transcript** into the "System Prompt" of the chat history.
*   **Pros:** Simple, no extra database cost.
*   **Cons:** Limited by the context window (can't handle 10-hour videos easily).

---

## 4. Recommendations for Your New App

If you are building a new AI app, here are your options:

### Option A: The "BrainTube" Stack (Fast & Cheap)
*   **AI:** Groq (Llama 3)
*   **Scraping:** Custom Netlify Function (Node.js)
*   **Best for:** Free tools, MVPs, consumer apps where speed is key.

### Option B: The "Enterprise" Stack (Robust & Powerful)
*   **AI:** OpenAI (GPT-4o) or Anthropic (Claude 3.5 Sonnet)
*   **Scraping:** Use a paid API service (like Apify or SerpApi) instead of a custom scraper.
    *   *Why?* Custom scrapers break whenever YouTube updates their UI. Paid APIs handle that maintenance for you.
*   **Best for:** Commercial products where reliability is worth the cost.

### Option C: The "Local-First" Stack (Private)
*   **AI:** Chrome's new built-in generic AI (Gemini Nano) or a locally running Ollama.
*   **Best for:** Privacy-focused apps, offline capability, zero server costs.
