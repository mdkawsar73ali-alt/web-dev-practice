Lookin Message - Final (simple)

- This package contains a minimal React + Vite project wired to your Firebase config.
- Features:
  - Google sign-in (stores minimal profile: displayName, photoURL; no email shown)
  - Navbar: Home, Friends, Messages
  - Friends page: left = Search, All Users (＋), Friend Requests (Accept/Reject); right = Friend List
  - Uses Firebase Realtime Database paths: /users, /friendRequests/{uid}, /friends/{uid}, /messages (future)
- How to run:
  1. npm install
  2. npm run dev
- After logging in with multiple accounts, try sending friend requests between them. If things don't show, open Firebase Realtime Database in console and inspect paths.
- IMPORTANT: Add proper Firebase Realtime Database rules before production.
