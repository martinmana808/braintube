# BrainTube Project Rules

## 1. Tech Stack & Non-Negotiables
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion for animations.
- **Backend/Storage**: Supabase (Database & Auth), Netlify Functions (Proxy APIs).
- **APIs**: YouTube Data API v3 (channel fetching), Groq API (Llama 3, for transcripts/summaries).
- **State Management**: LocalStorage for session caches and ephemeral states, Supabase for permanent sync.

## 2. Directory Structure
- `/src/components/`: Reusable, atomic React components (modals, cards, UI elements).
- `/src/components/sidebar/`: Sidebar specific sub-components (UserProfile, SettingsPanel, Channels).
- `/src/components/column/`: Video Column abstraction and structural lists.
- `/src/pages/`: Page roots (Dashboard).
- `/src/services/`: Supabase, Netlify API wrappers, and Quota trackers.
- `/docs/`: The Master Logging Protocol source of truth. Contains Indes, Vault, Manifesto, and Rules.

## 3. Coding Standards
- **Component Design**: Favor functional components with Hooks. Keep them decoupled when possible.
- **API Quota Defenses**: ALWAYS default to database cache first. YouTube Data API limits are 10k/day. Only perform deep scraping when explicitly required by a user action.
- **Styling**: Favor standard Tailwind utility classes. Only use `index.css` for complex or highly specific animations/pseudo-selectors.
- **Environment Variables**: All external APIs must safely source configurations from `.env` in local or production server environments. API Keys from the user must be stored locally in LocalStorage.

## 4. Master Logging Protocol Execution
- Every successful major PR, bugfix, or feature implementation must be thoroughly documented.
- Follow the Sync Workflow documented in `PROJECT_log-index.md`: Generate a Task ID, copy verbatim artifacts into the Vault (`PROJECT_log-detail.md`), update the Index history, update the Manifesto as necessary, and append the trace into the Git Commit message.
