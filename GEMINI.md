# BrainTube Project Index

## Project Summary
BrainTube is a curated YouTube experience allowing users to organize channels and leverage AI for video summaries and chat.
**Tech Stack**: React, Vite, Tailwind CSS, Netlify Functions, Groq API (Llama 3), youtubei.js.

## History
### [2026-01-03] Strict Schedule & Keep Alive | [Technical Details](./GEMINI--logs.md#log-20260103-strict-schedule)
- Implemented strict hourly sync (max 24 checks/day) to prevent double-fetching.
- Added GitHub Action (`keep-alive.yml`) to ping Supabase weekly and prevent project pausing.

### [2026-01-03] Optimized Sync & UI Cleanup | [Technical Details](./GEMINI--logs.md#log-20260103-optimized-sync)
- Optimized `fetchVideos` to only fetch durations for new videos, saving API quota.
- Implemented smart cache merging in `Dashboard.jsx` to preserve history.
- Removed intrusive "Sync Up to Date" and "Sync Started" alerts.

### [2026-01-02] Hybrid Caching & Quota Protection | [Technical Details](./GEMINI--logs.md#log-20260102-hybrid-caching)
- Implemented 3-tier caching (LocalStorage, Supabase, YouTube) to save API quota.
- Added "Once a day" background sync logic for monitoring 18 channels.
- Added "Refresh Feed" button and Quota Error UI banner.
- Verified and preserved Supabase 406 fix and AI Chat fallback improvements.

### [2026-01-02] Debugging AI & Supabase Errors | [Technical Details](./GEMINI--logs.md#log-20260102-ai-debug)
- Fixed Auth redirect by instructing on Supabase whitelist.
- Replaced `youtubei.js` with `youtube-transcript` to resolve 400 Precondition errors.
- Added detailed logging to `get-transcript` Netlify function.
- Identified Supabase 406 error as missing RLS policies and provided SQL fix.
