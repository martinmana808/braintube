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

<a name="log-20260102-ai-debug"></a>
## [2026-01-02] Debugging AI & Supabase Errors

**User Prompt:** (Multiple troubleshooting prompts regarding 500/406 errors and localhost redirects)

### Steps Taken:
1. **Redirect Fix**: Whitelisted `http://localhost:8888/*` and `http://localhost:5173/*` in Supabase Dashboard.
2. **Library Switch**: Replaced `youtubei.js` with `youtube-transcript` in Netlify functions. The former was hitting a `400 Precondition Failed` error, likely due to YouTube's bot detection.
3. **Enhanced Logging**: Updated `get-transcript.js` to log detailed errors to the server console.
4. **Supabase RLS**: Identified `406 Not Acceptable` as an RLS policy issue and provided a migration script to the user.

### Current Status:
- Waiting for user to apply SQL policies and test with the new library.

<a name="log-20260102-hybrid-caching"></a>
## [2026-01-02] Implementing Hybrid Caching & Quota Protection

**User Prompt:** I want to know how this exactly works. So... videos that have been fetched already, should be CACHED and not fetched again... TODAY column should be fetched ONCE A DAY, and the PAST 7 days should always come from the cached data... Should we use some localStorage?

### Implementation Details:
1.  **3-Tier Cache Architecture**:
    *   **LocalStorage**: Instant UI hydration on mount (Tier 1).
    *   **Supabase**: Long-term persistence across devices via `cached_videos` and `last_synced_at` columns (Tier 2).
    *   **YouTube API**: Background synchronization for channels older than 12 hours (Tier 3).
2.  **Quota Aware UI**:
    *   Implemented `setQuotaError` state in `Dashboard.jsx`.
    *   Added a prominent red banner that appears if the API limit is reached.
3.  **Manual Sync Control**:
    *   Added a "Refresh Feed" button to the dashboard header to allow users to force a YouTube fetch manually.
4.  **Resilience Improvements**:
    *   Fixed `Dashboard.jsx` JSX syntax errors introduced during the layout change.
    *   Ensured `addChannel` and `addVideoByLink` immediately seed the new cache.

### Artifacts:
#### Implementation Plan
(See `implementation_plan.md` for full technical breakdown)

#### Walkthrough
(See `walkthrough.md` for visual and functional summary)

### Final Status:
- Caching layer active.
- Quota burn drastically reduced.
- Known fixes (Supabase 406, AI fallback) confirmed and preserved.

<a name="log-20260103-optimized-sync"></a>
## [2026-01-03] Optimized Sync & UI Cleanup

**User Prompt:** we dont need this: [ Sync Up to Date All your channels were already synced in the last 12 hours. ] And Ive got a question. We dont wanna blow up youtube api. So, whenever the fetch happens automatically, or I click on refresh feed, every channel gets CHECKED but only NEW VIDEOS are fetched, right? WE are not refetching records we already have

### Verbatim Artifacts:

#### Implementation Plan: Optimized Sync & UI Cleanup

We want to reduce YouTube API quota usage and remove intrusive sync alerts.

## Proposed Changes

### YouTube Service
#### [MODIFY] [youtube.js](file:///Users/martinmana/Documents/Projects/braintube/src/services/youtube.js)
- Update `fetchVideos` to accept `existingVideos` parameter.
- Only fetch durations (`videos.list`) for videos not already in `existingVideos`.
- Merge existing data with new playlist result to return a complete, updated list.

### Dashboard Page
#### [MODIFY] [Dashboard.jsx](file:///Users/martinmana/Documents/Projects/braintube/src/pages/Dashboard.jsx)
- Update `syncStaleChannels` to:
    - Pass `channel.cachedVideos` to `fetchVideos`.
    - Remove `showAlert` calls for "Sync Up to Date" and "Sync Started".
    - Correctly merge newly fetched videos into the front of the channel's `cachedVideos` list, ensuring no duplicates.
    - Persist the merged list to Supabase and LocalStorage.

## Verification Plan
### Automated Tests
- N/A (Manual verification is more suitable for UI/API behavior here).

### Manual Verification
- Click "Refresh Feed" and verify that it doesn't show the intrusive alert.
- Check logs (if added) or monitor network tab to see if `videos?id=...` call is smaller when some videos are already cached.
- Verify that old videos are not lost from the cache after a sync.

#### Walkthrough: Optimized Sync & UI Cleanup

I have optimized the YouTube synchronization process to be more efficient with API quota and removed the intrusive sync alerts as requested.

## Changes Made

### 1. Quota-Efficient Video Fetching
Updated the `fetchVideos` service to accept an `existingVideos` parameter.
- **Before**: Every sync fetched the latest 10 videos and then made a second API call to get durations for all 10 videos (costing `1 + 10` units).
- **After**: The app still checks the playlist for the latest 10 videos (`1` unit), but it now filters that list against your cache. It **only** calls the durations API for videos that are actually new (e.g., if only 1 video is new, it costs `1 + 1` instead of `1 + 10`).

```javascript
// src/services/youtube.js
const newVideoIds = playlistVideoIds.filter(id => !existingVideos.some(ev => ev.id === id));
// ...
if (newVideoIds.length > 0) {
  // Only fetch details for new ones
  const detailsResponse = await fetch(`...&id=${newVideoIds.join(',')}`);
}
```

### 2. Smart Cache Merging
Updated `Dashboard.jsx` to correctly merge synced videos with the existing cache.
- **Before**: The cache for a channel was overwritten with the latest 10 videos.
- **After**: New videos are prepended to the existing cache, ensuring you don't lose older videos just because they dropped off the "latest 10" list on YouTube.

### 3. UI Cleanup
Removed the following intrusive alerts:
- "Sync Started" (when clicking Refresh Feed)
- "Sync Complete"
- "Sync Up to Date"

The "Refresh Feed" button now works silently in the background, with the loading spinner indicating progress.

## Verification
- [x] `fetchVideos` correctly identifies new vs. existing videos.
- [x] `Dashboard` merges channel videos without duplicates.
- [x] Sync alerts are removed.
- [x] Quota usage is minimized by batching duration fetches only for new IDs.

### Final Status:
- Sync logic is now quota-optimized.
- UI is cleaner without repetitive sync alerts.
- Channel historical cache is preserved (not overwritten).

<a name="log-20260103-strict-schedule"></a>
## [2026-01-03] Strict Schedule & Keep Alive

**User Prompt:** set up the GitHub Action file to Keep Alive. And lets set a STRICT SCHEDULE, but not every 6 hours, but every hour (max 24 times a day).

### Verbatim Artifacts:

#### Implementation Plan: Strict Schedule & Keep Alive

We are refining the sync strategy to be strictly time-slot based (Hourly) and adding an automated "heartbeat" to prevent Supabase from pausing the free tier project.

## User Review Required
> [!IMPORTANT]
> The GitHub Action requires a `SUPABASE_URL` and `SUPABASE_ANON_KEY` to be set as **Secrets** in your GitHub repository settings.
> 1. Go to Repo Settings > Secrets and variables > Actions.
> 2. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

## Proposed Changes

### Automation (Keep Alive)
#### [NEW] [.github/workflows/keep-alive.yml](file:///Users/martinmana/Documents/Projects/braintube/.github/workflows/keep-alive.yml)
- A GitHub Action that runs on a schedule (`0 0 * * 1` - Every Monday).
- It performs a simple `curl` request to your Supabase Rest API (e.g., reading the `channels` table with `limit=1`).
- This counts as "Activity" and prevents the 7-day pause.

### UI / Logic (Strict Hourly Sync)
#### [MODIFY] [Dashboard.jsx](file:///Users/martinmana/Documents/Projects/braintube/src/pages/Dashboard.jsx)
- **Current Logic**: `now - lastSynced > 12 hours`.
- **New Logic**:
    1. Calculate the current "Hourly Slot" (e.g., `2026-01-03T14:00:00.000Z`).
    2. Check if `lastSyncedAt` falls within this current slot.
    3. If `yes`: Do nothing (Already synced this hour).
    4. If `no`: Sync (and stamp with current time).
- This ensures max **1 sync per hour** (24 max/day), and only if the user opens the app.

<a name="log-20260107-app-launch"></a>
## [2026-01-07] Application Launch Verification

**User Prompt:** can we run this?

### Verbatim Artifacts:

#### Implementation Plan: Running BrainTube

This plan outlines the steps to run the BrainTube application locally for development and verification.

## Proposed Changes

### Environment Verification
We will check if the development server starts correctly. If environment variables are missing, the application might fail to fetch data from Supabase or YouTube.

### Start Development Server
1. Run `npm run dev` to start the Vite development server.
2. Note the local URL (usually `http://localhost:5173`).

### Browser Verification
1. Open the browser to the local URL.
2. Verify if the login page or dashboard loads correctly.

## Verification Plan

### Automated Tests
- None available in the repository.

### Manual Verification
1. **Launch**: Run `npm run dev` and confirm it starts without errors.
2. **Browser**: Navigate to the provided URL.
3. **Smoke Test**: 
    - Verify the Login page appears.
    - Check for any console errors related to missing environment variables.

#### Walkthrough: BrainTube Launch Walkthrough

This walkthrough documents the steps taken to run the BrainTube application and the current status of the development environment.

## Changes Made

### Environment Check
- Verified that the project uses Supabase and Groq for AI features.
- Confirmed that environment variables are expected for `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_YOUTUBE_API_KEY`, and `VITE_GROQ_API_KEY`.

### Server Startup
- Successfully started the Vite development server using `npm run dev`.
- The server is running at [http://localhost:5175/](http://localhost:5175/).

## Verification Results

### Development Server
The server is active and listening for connections.
```
  VITE v7.2.4  ready in 307 ms

  ➜  Local:   http://localhost:5175/
  ➜  Network: use --host to expose
```

### Browser Verification
> [!WARNING]
> I encountered a system error when attempting to open the browser automatically: `command 'browserLauncher.launchBrowser' not found`.

#### Status: Manual Verification Required
Since I cannot access the browser, I recommend verifying the application manually by navigating to [http://localhost:5175/](http://localhost:5175/) in your browser.

<a name="log-20260107-ai-documentation"></a>
## [2026-01-07] AI Implementation Documentation

**User Prompt:** Can you explain how we are using ai and what are we using and how we have implemented it? I need to make a new app that needs ai, and i want it to know options. please make a file called ai_explanation_260107.md

### Verbatim Artifacts:

#### AI Explanation Document
(See `ai_explanation_260107.md` for full text)

## Summary of Work
- Analyzed `src/services/ai.js` and `netlify/functions/get-transcript.js`.
- Identified specific technology stack: Groq API (Llama 3.3) and Custom Netlify Scraper (Deep Scraping).
- Created `ai_explanation_260107.md` detailing architecture and providing options for new apps.



<a name="log-20260202-sync-loop-fix"></a>
## [2026-02-02] Fix Infinite Sync Loop

**User Prompt:** I loaded this project after a long time. My supabase project was paused. So i resumed it. but then it kept loading forever the videos and channels. loaded, flushed, loaded again, in a loop. forever. so i closed the page to not blow up my youtube api. here's the console for you to see whats goging on

### Verbatim Artifacts:

#### Implementation Plan

# Fix Infinite Sync Loop

## Goal Description
The application was entering an infinite loop of "Syncing stale channel" actions upon loading. This was caused by the synchronization logic in `Dashboard.jsx` being inside a `useEffect` that depended on `channels`. When a channel was synced, `setChannels` was called, triggering the `useEffect` again, and restarting the sync process.

## User Review Required
None. This is a critical bug fix.

## Proposed Changes
### src/pages/Dashboard.jsx
#### [MODIFY] [Dashboard.jsx](file:///Users/martinmana/Documents/Projects/braintube/src/pages/Dashboard.jsx)
- Import `useRef` from 'react'.
- Create `isSyncingRef` to track synchronization status.
- Wrap the `syncStaleChannels` logic in a check for `isSyncingRef.current`.
- Use `try/finally` to ensure `isSyncingRef.current` is reset to `false` even if errors occur.

## Verification Plan
### Automated Tests
- None available for this UI behavior.

### Manual Verification
- Observe the browser console logs.
- Expected behavior: "Syncing stale channel" messages should appear once for each stale channel, then stop. "Dashboard: fetchData started" should not cycle indefinitely.

#### Walkthrough

# Walkthrough - Sync Loop Fix

I have fixed the infinite synchronization loop in `Dashboard.jsx`.

## Changes
### Dashboard.jsx

I introduced a `useRef` lock (`isSyncingRef`) to prevent the `syncStaleChannels` function from running concurrently or restarting while a sync is already in progress.

```javascript
  const isSyncingRef = useRef(false);

  // ... inside useEffect ...
    const syncStaleChannels = async () => {
      // Prevent concurrent syncs
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      try {
          // ... existing sync logic ...
      } finally {
        isSyncingRef.current = false;
      }
    };
```

## Verification Results
### Automated Tests
- N/A

### Manual Verification
- The infinite loop in the console should be resolved.
- Channels will still sync when stale, but only one pass will occur at a time.

<a name="log-20260202-settings-panel-crash"></a>
## [2026-02-02] Fix SettingsPanel Crash

**User Prompt:** now it is stuck on 'fetching data'... react-dom_client.js?v=348f0620:20103 TypeError: Cannot read properties of undefined (reading 'has')

### Details
The `SettingsPanel` component was attempting to access `collapsedCategories.has()`, but the `collapsedCategories` prop was undefined. This state was missing from `Dashboard.jsx`.

### Fix
- Added `const [collapsedCategories, setCollapsedCategories] = useState(new Set());` to `Dashboard.jsx`.
- Added toggle handler.
- Passed both as props to `SettingsPanel`.


<a name="log-20260202-quota-tracking"></a>
## [2026-02-02] Implement API Quota Tracking

**User Prompt:** "Probably we can check how much of YouTube quota, and any other api we use, we have left... We could have this small, next to the FEED heading."

### Implementation
Implemented a system to track API usage per day (resets at midnight).
- **Service:** Created  to manage  and  in LocalStorage.
- **Instrumentation:** Updated  and  to increment these counters.
- **UI:** Updated  to show usage stats: "YT: XXX/10k" and "AI: XXX toks".


<a name="log-20260202-quota-tracking"></a>
## [2026-02-02] Implement API Quota Tracking

**User Prompt:** "Probably we can check how much of YouTube quota, and any other api we use, we have left... We could have this small, next to the FEED heading."

### Implementation
Implemented a system to track API usage per day (resets at midnight).
- **Service:** Created `src/services/quota.js` to manage counters in LocalStorage (`bt_quota_youtube`, `bt_quota_groq`).
- **Instrumentation:** Updated `youtube.js` and `ai.js` to increment these counters.
- **UI:** Updated `Dashboard.jsx` to show usage stats: "YT: XXX/10k" and "AI: XXX toks".


<a name="log-20260202-docs-and-todo"></a>
## [2026-02-02] Documentation & Roadmap Update

**User Prompt:** "can we make a document that is called QUOTA-ECONOMY... where we CONSTANTLY document the way we are gonna handle storage"

### Details
- **New Artifact:** Created `QUOTA-ECONOMY.md` to document the "Supabase First" caching strategy and data flow.
- **Debugging:** Injected console logs into `Dashboard.jsx` to trace the cache hit/miss logic during sync.
- **Roadmap:** User manually updated `TODO.md` with new priorities (Saved videos importance, UI improvements).
- **README:** Updated `README.md` to mention the new "Economy & Quota Management" features.


<a name="log-20260202-yolo-dashboard"></a>
## [2026-02-02] YOLO Dashboard & Video Modal Enhancements

**User Prompt:** "execute all tasks listed in TODO.md... perform these tasks one by one... address all actionable items"

**Implemented Features & Fixes:**
1.  **Carousel**: Added `Previous/Next` navigation to `VideoModal` (Dashboard.jsx, VideoModal.jsx).
2.  **Auth Fix**: Passed `user` and `onSignOut` to `SettingsPanel/UserProfile` to fix avatar display.
3.  **Category Selection**: Improved visual feedback for "No Category" in `CategoryPillSelector` and verified logic.
4.  **AI Chat Removal**: Nuked the AI Chat tab and logic from `VideoModal.jsx` to simplify the UI.
5.  **AI Summary Fix**: Added error handling/feedback to `SummaryModal` and `Dashboard.jsx`.
6.  **Saved Column**: Implemented a conditional "Saved Videos" column that appears when toggling "Saved" or saving a video.
    - Added `isSavedColumnOpen` state in `Dashboard.jsx`.
    - Updated `SavedChannelItem` to toggle this view.
7.  **Notes System**: Re-introduced tabs in `VideoModal` ("Summary" & "Notes") and added `notes` state/persistence to `video_metadata` via Supabase.
8.  **Hover Buttons**: Made actions on `VideoCard` visible only on hover.
9.  **Shorts Tag**: Added visual badge for videos < 60s.

**Files Modified:**
- `src/pages/Dashboard.jsx` (Logic for Saved Column, Notes, Auth props)
- `src/components/VideoModal.jsx` (Notes Tab, Carousel Buttons, Chat Removal)
- `src/components/VideoCard.jsx` (Hover effects, Shorts tag)
- `src/components/SettingsPanel.jsx` & `src/components/sidebar/*` (Prop drilling for Saved view)
- `src/services/ai.js` (Verified logic)

