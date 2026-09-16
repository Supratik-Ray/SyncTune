# SyncTune

A real-time collaborative music listening web app built around the YouTube IFrame Player API.

Two or more users can join the same temporary room using a short room code and listen to the same YouTube music video in sync. Any participant can control playback, seek, or change the current song.

> **Project status:** MVP / prototype  
> **Database:** None required  
> **Authentication:** None required  
> **Playback:** YouTube IFrame Player API  
> **Realtime:** Socket.IO

---

## 1. Product Vision

SyncTune should feel like a lightweight, modern music-streaming application where friends can listen to YouTube music together.

Typical flow:

```text
Landing Page
    ↓
Create Room / Join Room
    ↓
Room
    ↓
Search for music
    ↓
Select song
    ↓
YouTube player starts
    ↓
All connected users stay synchronized
```

The application is intentionally simple:

- No user accounts
- No permanent rooms
- No database
- No playlists stored permanently
- Room state exists in server memory
- A server restart can destroy all rooms

---

# 2. Core Requirements

## Room system

Users must be able to:

- Create a room
- Receive a short room code
- Copy the room code
- Copy an invite link
- Join an existing room using the code
- Open an invite URL such as `/room/AB7K2`
- See currently connected users
- Leave a room
- Reconnect to a room after a temporary connection loss

Example:

```text
Room Code: AB7K2

Invite:
https://synctune.example/room/AB7K2
```

Room codes should be:

- Short
- Uppercase
- Easy to read
- Difficult enough to avoid accidental collisions

Use something like 5–6 alphanumeric characters.

---

# 3. Playback Requirements

The main feature is synchronized YouTube playback.

Every participant in a room should approximately share:

- Current video
- Playing/paused state
- Current playback position

Every user can:

- Play
- Pause
- Resume
- Seek backward
- Seek forward
- Drag the progress bar
- Change the current song
- Add songs to the queue
- Play a queued song

Synchronization does NOT need to be sample-perfect.

A practical target is approximately:

```text
< 0.5–1 second drift
```

under normal network conditions.

---

# 4. YouTube Integration

Use the official YouTube IFrame Player API.

Do NOT:

- Download YouTube videos
- Extract audio/MP3
- Proxy YouTube media
- Scrape YouTube's media URLs
- Circumvent YouTube restrictions
- Bypass embedding restrictions

The YouTube video must remain an embedded YouTube player.

If a video cannot be embedded or becomes unavailable, display a useful error and allow the user to choose another result.

---

# 5. Music Search

The application should have a prominent search bar.

Example:

```text
Search songs, artists, albums...
```

Search results should display:

- Thumbnail
- Title
- Channel / artist
- Duration where available
- YouTube video ID

Clicking a result should allow the user to play it or add it to the room queue.

## Music-only goal

The application is intended primarily for:

- Songs
- Official music videos
- Lyric videos
- Audio releases
- Live performances
- Remixes
- Music-related videos

Avoid prioritizing:

- Gaming
- News
- Tutorials
- General educational videos
- Vlogs
- Reactions
- Random entertainment

### Important

YouTube does not provide a perfect guarantee that a search result is a music video.

Therefore:

**Do not pretend that the app has a perfect music-only filter.**

Instead, use a practical music-oriented search strategy:

- YouTube search parameters
- `type=video`
- `videoEmbeddable=true`
- Appropriate category filtering where useful
- Search/ranking heuristics
- Music-related keywords

Possible ranking signals:

```text
official music video
official audio
lyrics
audio
song
remix
live
music
```

Do not blindly reject results that lack these words.

---

# 6. API Key Security

If the YouTube Data API is used:

The API key MUST remain on the backend.

Never put the API key in:

```text
VITE_*
```

or any other frontend-exposed environment variable.

Use:

```text
YOUTUBE_API_KEY=
```

on the server.

Example `.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
YOUTUBE_API_KEY=YOUR_KEY_HERE
```

Create `.env.example` without real secrets.

---

# 7. Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Socket.IO Client
- YouTube IFrame Player API

## Backend

- Node.js
- Express
- TypeScript
- Socket.IO

## Database

None.

Do not introduce MongoDB, PostgreSQL, MySQL, Firebase, Supabase, Redis, or another persistent database for the MVP.

An in-memory `Map` is sufficient.

---

# 8. High-Level Architecture

```text
                    ┌─────────────────────┐
                    │       Browser A     │
                    │                     │
                    │ React + YouTube     │
                    │ Player + Socket.IO  │
                    └──────────┬──────────┘
                               │
                               │ WebSocket
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Node + Express      │
                    │                     │
                    │ Socket.IO Server    │
                    │                     │
                    │ In-memory Rooms     │
                    └──────────┬──────────┘
                               │
                               │ WebSocket
                               │
                               ▼
                    ┌─────────────────────┐
                    │       Browser B     │
                    │                     │
                    │ React + YouTube     │
                    │ Player + Socket.IO  │
                    └─────────────────────┘

                    YouTube Data API
                           ▲
                           │
                    Backend only
```

---

# 9. Room State

The backend should maintain rooms in memory.

Conceptually:

```ts
Map<string, Room>
```

A room can contain:

```ts
type Room = {
  code: string;
  users: Map<string, User>;
  currentVideo: Video | null;
  queue: Video[];
  isPlaying: boolean;
  baseTime: number;
  lastUpdatedAt: number;
};
```

A user can contain:

```ts
type User = {
  socketId: string;
  nickname: string;
};
```

A video can contain:

```ts
type Video = {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle?: string;
  duration?: string;
};
```

The exact implementation can differ, but the responsibilities should remain clear.

---

# 10. Playback Synchronization Model

Do NOT send the playback timestamp to the server on every frame.

That would generate unnecessary traffic.

Instead, represent playback using:

```text
baseTime
lastUpdatedAt
isPlaying
```

When playing:

```text
expectedTime =
    baseTime +
    (Date.now() - lastUpdatedAt) / 1000
```

When paused:

```text
expectedTime = baseTime
```

The server can therefore describe the current state without constantly updating it.

---

# 11. Synchronization Events

Use Socket.IO events.

Suggested events:

```text
create-room
join-room
leave-room

room-state

play
pause
seek
change-video

queue-add
queue-remove
queue-reorder

user-joined
user-left

request-room-state
```

The exact event naming can be changed if there is a cleaner design.

---

# 12. Event Rules

## Create room

Client:

```text
create-room
```

Server:

1. Generate room code.
2. Create room.
3. Add creator.
4. Join creator's Socket.IO room.
5. Return room information.

---

## Join room

Client:

```text
join-room
```

Server:

1. Validate room code.
2. Check room exists.
3. Add user.
4. Join Socket.IO room.
5. Send current room state to the new user.
6. Notify existing users.

---

# 13. Play

When a user presses Play:

```text
Client
  ↓
get current YouTube time
  ↓
emit play
  ↓
Server updates room state
  ↓
broadcast play state
  ↓
Other clients call player.playVideo()
```

The timestamp sent with the event should represent the intended playback position.

---

# 14. Pause

When a user presses Pause:

```text
Client gets current player time
        ↓
emit pause(currentTime)
        ↓
Server stores paused position
        ↓
broadcast to other users
        ↓
Other clients seek + pause
```

---

# 15. Seek

When a user seeks:

```text
seek(newTime)
```

Server updates:

```text
baseTime = newTime
lastUpdatedAt = Date.now()
```

If the room is playing, playback continues from that position.

Other users should seek to the corresponding position.

---

# 16. Avoid Synchronization Loops

This is extremely important.

Do NOT do:

```text
User A pauses
→ server
→ User B pauses
→ YouTube emits PAUSED
→ User B sends pause
→ server
→ User A pauses
→ ...
```

Remote synchronization actions must NOT emit another synchronization event.

Maintain a distinction between:

```text
local action
```

and:

```text
remote synchronization
```

For example:

```ts
isApplyingRemoteUpdate.current = true;
player.pauseVideo();
isApplyingRemoteUpdate.current = false;
```

The exact implementation is up to the developer.

---

# 17. Drift Correction

Clients should periodically compare:

```text
localPlayerTime
```

against:

```text
expectedRoomTime
```

Do not constantly seek.

Example strategy:

```text
Every 2–5 seconds:

difference =
    expectedRoomTime - localPlayerTime

if abs(difference) > 0.75 seconds:
    seek to expectedRoomTime
```

The exact threshold and interval can be tuned during testing.

Avoid visible jitter.

---

# 18. Queue

The room should have a temporary queue.

Users can:

- Add song
- Remove song
- Play song
- See upcoming songs

Example:

```text
UP NEXT

01  Blinding Lights
    The Weeknd

02  Starboy
    The Weeknd

03  Die With A Smile
    Lady Gaga
```

The queue is room state and disappears when the room disappears.

---

# 19. Automatic Next Song

When the current YouTube video ends:

```text
Current video
      ↓
Queue contains next song?
      ↓
YES ─────────→ Load next video
      ↓
NO
      ↓
Remain stopped
```

Only one client should initiate a queue transition.

Preferably the server should coordinate this to avoid two clients simultaneously changing the song.

---

# 20. Presence

Display connected users.

Example:

```text
Listening together

● You
● Alex

2 listeners
```

Nicknames can be temporary.

No accounts are required.

Generate a nickname if the user does not provide one.

Example:

```text
Blue Panda
Red Fox
Purple Tiger
```

Do not persist these identities.

---

# 21. Connection Handling

Show connection state:

```text
● Connected
```

```text
○ Reconnecting...
```

```text
⚠ Connection lost
```

Socket.IO's reconnection functionality should be used.

After reconnecting:

```text
request-room-state
        ↓
server
        ↓
current room state
        ↓
client synchronizes YouTube player
```

---

# 22. UI Design

The visual design should be inspired by modern music streaming applications, especially the general feel of Spotify.

Do NOT copy Spotify's exact UI, logo, branding, or proprietary assets.

Use an original visual identity.

Desired characteristics:

- Dark interface
- Charcoal / black surfaces
- Music-oriented accent color
- Large artwork
- Rounded cards
- Clean typography
- Subtle gradients
- Smooth hover effects
- Good spacing
- Minimal visual clutter

The application should feel like a real product rather than a college-project dashboard.

---

# 23. Desktop Layout

Suggested structure:

```text
┌───────────────────────────────────────────────────────────────┐
│ SyncTune     Search songs...                    Room: AB7K2  │
├───────────────┬───────────────────────────────┬──────────────┤
│               │                               │              │
│ Home          │                               │   Up Next    │
│               │       YouTube Player          │              │
│ Search        │                               │   Song 1     │
│               │                               │   Song 2     │
│ My Room       │                               │   Song 3     │
│               │                               │              │
│               │                               │              │
├───────────────┴───────────────────────────────┴──────────────┤
│                                                               │
│    ◀◀       ▶ / ❚❚       ▶▶                                 │
│                                                               │
│  ───────────────────────────────────────────────              │
│  02:31                                      04:12             │
└───────────────────────────────────────────────────────────────┘
```

This is only a layout reference, not a strict requirement.

---

# 24. Mobile Layout

The application must be responsive.

On mobile:

- Sidebar becomes a bottom navigation or collapsible menu.
- Queue becomes a drawer/bottom sheet.
- Player remains usable.
- Search remains prominent.
- Room code remains accessible.
- Controls should be touch-friendly.

---

# 25. Pages

At minimum:

```text
/
```

Landing page.

```text
/create
```

Optional dedicated create-room page.

```text
/join
```

Optional join-room page.

```text
/room/:roomCode
```

Main listening room.

A simpler routing structure is acceptable if it provides the same UX.

---

# 26. Landing Page

The landing page should immediately communicate:

```text
Listen together.
Stay in sync.

Listen to YouTube music with your friends in real time.
```

Primary actions:

```text
Create Room
```

```text
Join Room
```

Keep the landing page visually polished but not overly complicated.

---

# 27. Room Header

The room page should show:

```text
SyncTune

Room: AB7K2

[ Copy Code ]
[ Copy Invite ]

● 2 listeners
```

The user should be able to easily share the room.

---

# 28. Search UX

Search should feel fast.

Suggested behavior:

```text
User types query
       ↓
debounce request
       ↓
backend searches YouTube
       ↓
results
```

Avoid sending a YouTube API request on every keystroke.

Use a debounce around 300–500ms if live search is implemented.

Alternatively, only search when the user presses Enter.

---

# 29. Search Result Card

Each result should look approximately like:

```text
┌──────────────────────────────────────┐
│ [thumbnail]  Song Title              │
│              Artist / Channel        │
│              4:12                    │
│                         [+ Queue]    │
└──────────────────────────────────────┘
```

Clicking the result can immediately play it if that is the chosen UX.

---

# 30. Player

The player should show:

- YouTube video
- Current title
- Thumbnail/artwork where appropriate
- Play/pause
- Previous/next where applicable
- Seek backward
- Seek forward
- Progress
- Current time
- Duration
- Volume

Use the YouTube player for actual playback.

Do not create a fake audio player that attempts to play extracted YouTube audio.

---

# 31. Error States

Handle at least:

### Invalid room

```text
Room not found

Check the code and try again.
```

### Empty search

```text
No music found

Try another artist or song.
```

### YouTube failure

```text
This video couldn't be played.

Try another result.
```

### Connection problem

```text
Connection lost

Trying to reconnect...
```

### API quota/error

```text
Search is temporarily unavailable.

Please try again later.
```

Do not expose raw stack traces to users.

---

# 32. Folder Structure

A reasonable structure:

```text
synctune/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SearchResults.tsx
│   │   │   ├── YouTubePlayer.tsx
│   │   │   ├── PlayerControls.tsx
│   │   │   ├── Queue.tsx
│   │   │   ├── RoomHeader.tsx
│   │   │   ├── UserList.tsx
│   │   │   └── ...
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── JoinRoom.tsx
│   │   │   └── Room.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useSocket.ts
│   │   │   ├── useRoom.ts
│   │   │   └── useYouTubePlayer.ts
│   │   │
│   │   ├── services/
│   │   │   └── socket.ts
│   │   │
│   │   ├── types/
│   │   └── App.tsx
│   │
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── server.ts
│   │   ├── rooms/
│   │   │   └── roomManager.ts
│   │   ├── socket/
│   │   │   └── socketHandlers.ts
│   │   ├── services/
│   │   │   └── youtubeService.ts
│   │   └── types/
│   │
│   └── package.json
│
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

The structure can be changed if the implementation has a clear reason.

---

# 33. State Management

Do not introduce Redux unless it is genuinely necessary.

React state/context/hooks should be sufficient for the MVP.

Separate:

```text
UI state
```

from:

```text
Room state
```

and:

```text
YouTube player state
```

Socket event handling should be centralized enough to avoid duplicated listeners.

---

# 34. Security / Validation

Validate on the server.

Do not trust the client for:

- Room existence
- Room membership
- Video IDs
- Queue modifications
- Playback state

Validate:

- Room code format
- Video ID format
- Required event fields
- Maximum queue length
- Nickname length

Basic rate limiting for search requests is desirable if practical.

---

# 35. Room Cleanup

Because there is no database, rooms should be cleaned up.

If a room has no connected users:

```text
delete room
```

Optionally add a short grace period so temporary disconnects do not immediately destroy the room.

For example:

```text
No users
    ↓
wait 5–10 minutes
    ↓
still empty?
    ↓
delete
```

The exact implementation can be simpler for the MVP.

---

# 36. No Database Requirement

Do not add a database just because this is a full-stack application.

The MVP intentionally uses:

```text
Node process memory
```

for room state.

Persistence is not a requirement.

If future scaling requires Redis or another shared state system, that can be added later.

---

# 37. Development Environment

Recommended local setup:

```text
Frontend:
http://localhost:5173

Backend:
http://localhost:5000
```

Socket.IO should connect using a configurable backend URL.

Example:

```env
VITE_API_URL=http://localhost:5000
```

Only public configuration should use `VITE_*`.

Never put the YouTube API key there.

---

# 38. Scripts

Root-level scripts should make development easy.

Ideally:

```bash
npm install
npm run dev
```

starts both frontend and backend.

If separate commands are preferable:

```bash
npm run dev:client
npm run dev:server
```

Document the actual commands in this README after implementation.

---

# 39. Testing

The implementation must be tested using two browser windows.

## Test A — Room creation

```text
Browser A
→ Create Room
→ receives room code
```

Expected:

```text
Room exists
```

---

## Test B — Room joining

```text
Browser B
→ enters room code
```

Expected:

```text
Both users appear in room
```

---

## Test C — Playback

```text
A plays song
```

Expected:

```text
B starts approximately at the same time
```

---

## Test D — Pause

```text
B pauses
```

Expected:

```text
A pauses
```

---

## Test E — Seek

```text
A seeks from 1:20 → 2:30
```

Expected:

```text
B seeks to approximately 2:30
```

---

## Test F — Change video

```text
B chooses another song
```

Expected:

```text
A loads the same song
```

---

## Test G — Queue

```text
A adds Song X
B sees Song X
```

Expected:

```text
Queue is identical
```

---

## Test H — Reconnection

Disconnect one browser temporarily.

Reconnect.

Expected:

```text
Client requests room state
        ↓
Server responds
        ↓
Player synchronizes
```

---

# 40. Implementation Order

Build in this order.

## Phase 1 — Project setup

- React/Vite/TypeScript
- Node/Express/TypeScript
- Socket.IO
- Tailwind
- Basic routing
- Environment variables

## Phase 2 — Rooms

Implement:

- Create room
- Join room
- Room code
- Room URL
- In-memory room manager
- Presence

## Phase 3 — YouTube player

Implement:

- YouTube IFrame Player API
- Load video
- Play
- Pause
- Seek
- Player events

## Phase 4 — Synchronization

Implement:

- Play event
- Pause event
- Seek event
- Change video event
- Room state
- Drift correction
- Reconnection

## Phase 5 — Search

Implement:

- Backend YouTube search
- API key
- Search results
- Music-oriented filtering/ranking
- Loading/error states

## Phase 6 — Queue

Implement:

- Add
- Remove
- Play
- Next song
- Synchronized queue

## Phase 7 — UI polish

Implement:

- Spotify-inspired layout
- Animations
- Responsive mobile UI
- Empty states
- Connection indicators
- Better typography and spacing

---

# 41. Development Rules for AI Coding Agents

When modifying this project:

### Rule 1

Read this README before making architectural changes.

### Rule 2

Do not add a database unless explicitly requested.

### Rule 3

Do not replace Socket.IO with polling.

### Rule 4

Do not replace YouTube playback with downloaded/extracted audio.

### Rule 5

Do not expose `YOUTUBE_API_KEY` to the browser.

### Rule 6

Do not rewrite the entire application to fix a small bug.

### Rule 7

Prefer small, understandable changes.

### Rule 8

Before adding a dependency, check whether the feature can reasonably be implemented with the existing stack.

### Rule 9

Do not create duplicated Socket.IO listeners.

### Rule 10

Avoid synchronization feedback loops.

### Rule 11

Do not constantly broadcast playback position.

### Rule 12

The server is authoritative for room state.

### Rule 13

The client is responsible for controlling its local YouTube player.

### Rule 14

Never claim that YouTube search is perfectly music-only.

### Rule 15

Keep the MVP simple.

---

# 42. Definition of Done

The MVP is considered complete when:

- [ ] User can create a room
- [ ] User can copy room code
- [ ] User can copy invite link
- [ ] Another user can join
- [ ] Both users appear in the room
- [ ] User can search YouTube
- [ ] Search primarily returns music-oriented results
- [ ] User can play a YouTube video
- [ ] Other users receive the same video
- [ ] Play synchronizes
- [ ] Pause synchronizes
- [ ] Seek synchronizes
- [ ] Changing video synchronizes
- [ ] Queue synchronizes
- [ ] Ended videos can advance to the next queue item
- [ ] Reconnection restores room state
- [ ] Drift is periodically corrected
- [ ] Invalid rooms are handled
- [ ] YouTube errors are handled
- [ ] API errors are handled
- [ ] Mobile UI works
- [ ] No database is used
- [ ] No YouTube audio/video downloading is used
- [ ] API key is not exposed
- [ ] Two-browser testing passes
- [ ] README contains actual setup/deployment instructions

---

# 43. Future Features — NOT MVP

Do not implement these unless explicitly requested:

- User accounts
- Google authentication
- Permanent playlists
- Persistent listening history
- Friend system
- Chat
- Reactions
- Spotify integration
- Apple Music integration
- Voice chat
- Redis
- Database persistence
- Recommendation engine
- AI music recommendations
- Lyrics synchronization
- Advanced audio visualization

These can be considered after the MVP is stable.

---

# 44. Guiding Principle

SyncTune is primarily a **real-time synchronization project**, not a database project.

The most important technical problem is:

```text
How do multiple browsers control separate YouTube players
while maintaining approximately the same playback state?
```

Solve that reliably before adding unnecessary features.

The second priority is:

```text
How can users quickly find music and start listening together?
```

The third priority is:

```text
Make the experience feel polished and enjoyable.
```

Do not sacrifice the synchronization architecture for visual polish.

---

# 45. AI Agent Workflow

When an AI coding agent is asked to work on SyncTune, it should follow this workflow:

```text
1. Read README.md
       ↓
2. Inspect existing code
       ↓
3. Identify the smallest required change
       ↓
4. Implement it
       ↓
5. Run type checking
       ↓
6. Run build
       ↓
7. Fix errors
       ↓
8. Test relevant functionality
       ↓
9. Update README if architecture/setup changed
       ↓
10. Summarize changes
```

Do not assume functionality is complete merely because code compiles.

For synchronization-related changes, test with two browser sessions whenever possible.
