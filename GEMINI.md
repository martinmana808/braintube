# BrainTube Project Index

## Project Summary
BrainTube is a curated YouTube experience allowing users to organize channels and leverage AI for video summaries and chat.
**Tech Stack**: React, Vite, Tailwind CSS, Netlify Functions, Groq API (Llama 3), youtubei.js.

## History
### [2026-02-02] YOLO Dashboard & Video Modal Enhancements | [Technical Details](./GEMINI--logs.md#log-20260202-yolo-dashboard)
- Implemented **Carousel**, **Notes**, **Saved Column**, **Shorts Tag**, and **Hover Actions**.
- Fixed **Auth Display**, **Category Bug**, and **AI Summary** error handling.
- Removed **AI Chat** feature.
### [2026-02-02] Documentation & Roadmap Update | [Technical Details](./GEMINI--logs.md#log-20260202-docs-and-todo)
- Created `QUOTA-ECONOMY.md` strategy document.
- Updated `README.md` and `TODO.md` with new priorities and system details.
- Injected debug logging for sync logic analysis.

### [2026-02-02] Implement API Quota Tracking | [Technical Details](./GEMINI--logs.md#log-20260202-quota-tracking)
- Implemented `quota.js` service to track daily YouTube (10k limit) and Groq usage.
- Added real-time usage stats ("YT: 154/10k", "AI: 2048 toks") to Dashboard header.

### [2026-02-02] Fix SettingsPanel Crash | [Technical Details](./GEMINI--logs.md#log-20260202-settings-panel-crash)
- Resolved `TypeError` in `SettingsPanel` by initializing missing `collapsedCategories` state in `Dashboard.jsx`.

### [2026-02-02] Fix Infinite Sync Loop | [Technical Details](./GEMINI--logs.md#log-20260202-sync-loop-fix)
- Identified and fixed an infinite synchronization loop in `Dashboard.jsx`.
- Implemented `useRef` based locking to prevent recursive effect triggers.


### [2026-01-07] AI Implementation Documentation | [Technical Details](./GEMINI--logs.md#log-20260107-ai-documentation)
- Created `ai_explanation_260107.md` detailing Groq and Custom Scraper implementation.
- Analyzed and documented the "Deep Scraping" strategy used in Netlify functions.

### [2026-01-07] Application Launch Verification | [Technical Details](./GEMINI--logs.md#log-20260107-app-launch)
- Successfully started development server at `http://localhost:5175`.
- Verified environment variable requirements for Supabase, YouTube, and Groq.
- Requested manual browser verification due to tool limitations.

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
