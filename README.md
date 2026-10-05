# 🎵 PlaylistBridge

PlaylistBridge is an open-source application designed to transfer playlists between music streaming platforms.

The project currently focuses on **Spotify ↔ Apple Music**, with the goal of providing reliable and transparent track matching even when metadata differs between platforms.

Rather than blindly selecting the first search result returned by another provider, PlaylistBridge analyses track metadata, calculates a confidence score and lets the conversion workflow distinguish reliable, uncertain and missing matches.

> 🚧 PlaylistBridge is currently under active development.

---

## ✨ Features

### Spotify

- OAuth 2.0 authentication with PKCE
- Spotify user profile retrieval
- Complete Spotify playlist library retrieval
- Automatic pagination for large playlist libraries
- Playlist ownership filters: `Mine`, `All` and `Saved`
- Playlist search
- Alphabetical sorting
- Library pagination
- Playlist details view
- Complete playlist track retrieval with pagination
- Spotify track normalization into a platform-independent format
- ISRC extraction when available
- Support for playlists containing hundreds of tracks

### Apple Music

- Apple Music catalog search
- Apple Music track normalization
- Developer token generation through a backend service
- Spotify tracks can already be searched against the real Apple Music catalog
- Integration with the PlaylistBridge matching engine

Apple Music user authorization and library playlist creation are currently under development.

### Track matching

PlaylistBridge includes its own matching engine to identify the same track across different streaming services.

Matching can use:

- ISRC
- Track title
- Artists
- Album
- Track duration
- Metadata normalization

The matching engine classifies results as:

- `matched`
- `uncertain`
- `unmatched`

This allows PlaylistBridge to avoid blindly selecting the first catalog result returned by another music provider.

### Conversion workflow

The current Spotify → Apple Music workflow supports:

- Playlist selection
- Full source playlist loading
- Real-time conversion progress
- Apple Music catalog search
- Match confidence calculation
- Conversion summary
- Detailed review of every analysed track
- Matched / uncertain / unmatched statistics

Manual validation of uncertain matches and final Apple Music playlist creation are the next major steps.

---

## 🏗️ Architecture

PlaylistBridge is organized as a monorepo:

```text
playlist-bridge/
├── apps/
│   ├── api/                       # Backend services
│   │   └── src/
│   │       └── server.ts
│   │
│   └── web/                       # React + Vite application
│       └── src/
│           ├── components/
│           │   ├── SpotifyLibrary/
│           │   ├── PlaylistDetails/
│           │   └── ConversionModal/
│           │
│           ├── hooks/
│           │   ├── useSpotifyAuth.ts
│           │   ├── useSpotifyPlaylist.ts
│           │   └── usePlaylistConversion.ts
│           │
│           ├── App.tsx
│           └── musickit.ts
│
├── packages/
│   ├── core/                      # Shared models and matching engine
│   ├── spotify/                   # Spotify API integration
│   └── apple-music/               # Apple Music API integration
│
└── README.md
```

The application separates provider-specific APIs, UI components and conversion logic.

```text
┌─────────────┐
│   Spotify   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│   Normalized Track  │
│                     │
│ title               │
│ artists             │
│ album               │
│ duration            │
│ ISRC                │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Matching Engine   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Apple Music Catalog │
└─────────────────────┘
```

Provider-specific metadata is converted into a shared track model before matching.

This keeps the matching engine independent from Spotify or Apple Music and makes it possible to add additional providers later.

---

## ⚛️ Web application architecture

The React application keeps `App.tsx` focused on orchestration while feature-specific logic is isolated into dedicated hooks and components.

```text
useSpotifyAuth
      │
      ▼
Spotify authentication
User profile
Playlist library

useSpotifyPlaylist
      │
      ▼
Playlist selection
Track retrieval
Track mapping

usePlaylistConversion
      │
      ▼
Apple Music search
Matching
Progress
Conversion results
```

UI responsibilities are separated into components:

```text
SpotifyLibrary
      │
      ├── Search
      ├── Sorting
      ├── Ownership filters
      └── Pagination

PlaylistDetails
      │
      ├── Playlist metadata
      ├── Track listing
      └── Transfer action

ConversionModal
      │
      ├── Progress
      ├── Match statistics
      ├── Review
      └── Transfer state
```

This keeps provider communication, conversion logic and presentation concerns separated as the application grows.

---

## 🧠 Track matching

Metadata is rarely identical between streaming platforms.

For example:

```text
Spotify:
My Song - 2011 Remaster

Apple Music:
My Song
```

PlaylistBridge normalizes metadata before comparing tracks.

The current scoring strategy uses:

| Metadata | Weight |
| --- | ---: |
| Track title | 50% |
| Artists | 30% |
| Album | 10% |
| Duration | 10% |

When both tracks expose an identical ISRC, the match can be considered exact.

Additional safeguards reduce or cap confidence when:

- ISRCs conflict
- artists do not match
- track durations differ significantly

The resulting match is classified according to confidence:

```text
confidence >= 0.90       → matched
0.70 <= confidence < .90 → uncertain
confidence < 0.70        → unmatched
```

This approach makes conversion results inspectable instead of hiding uncertain matches from the user.

---

## 🟢 Spotify integration

Spotify authentication uses the **OAuth 2.0 Authorization Code flow with PKCE**.

No Spotify client secret is exposed in the frontend.

The current Spotify flow is:

```text
Authenticate user
        ↓
Load Spotify profile
        ↓
Load complete playlist library
        ↓
Search / filter / sort playlists
        ↓
Select playlist
        ↓
Load every playlist item
        ↓
Map Spotify tracks
        ↓
Normalized PlaylistBridge tracks
```

Pagination is handled automatically for both playlist libraries and playlist tracks.

The implementation has been tested with:

- more than 100 playlists in a Spotify library
- playlists containing more than 250 tracks

---

## 🍎 Apple Music integration

PlaylistBridge can communicate with the Apple Music catalog through the Apple Music API.

The current flow is:

```text
Normalized Spotify track
        ↓
Apple Music catalog search
        ↓
Candidate tracks
        ↓
PlaylistBridge matching engine
        ↓
Best candidate + confidence
        ↓
Matched / uncertain / unmatched
```

A backend service is used for operations that require Apple developer credentials, keeping sensitive signing material outside the browser.

Apple Music user authorization through MusicKit and final playlist creation are still under development.

---

## 🔄 Spotify → Apple Music conversion

The current conversion pipeline is:

```text
Spotify playlist
        ↓
Load all tracks
        ↓
Normalize Spotify metadata
        ↓
Search Apple Music catalog
        ↓
Compare candidates
        ↓
Calculate confidence
        ↓
┌───────────┬────────────┬─────────────┐
│  Matched  │ Uncertain  │  Unmatched  │
└───────────┴────────────┴─────────────┘
        ↓
Conversion review
```

The conversion UI displays progress while tracks are processed and provides a detailed result for every source track.

Only confidently matched tracks are intended to be transferred automatically.

Uncertain matches will require explicit user validation before transfer.

---

## 🛠️ Tech stack

- TypeScript
- React
- Vite
- Node.js
- Spotify Web API
- Apple Music API
- MusicKit
- Vitest
- OAuth 2.0
- PKCE

---

## 🚀 Getting started

### Requirements

- Node.js
- npm
- Spotify Developer application

Apple Music development additionally requires Apple Developer credentials.

### Clone the repository

```bash
git clone <repository-url>
cd playlist-bridge
```

### Install dependencies

Install the root dependencies:

```bash
npm install
```

Then install the web application dependencies:

```bash
cd apps/web
npm install
```

### Spotify configuration

Create:

```text
apps/web/.env.local
```

Using:

```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/callback
```

The same redirect URI must be configured in the Spotify Developer Dashboard.

> Never commit `.env`, `.env.local`, private keys or API credentials to Git.

### Start the web application

From `apps/web`:

```bash
npm run dev
```

Then open the local URL displayed by Vite.

### Start the API

The backend is located in:

```text
apps/api
```

Install its dependencies if needed:

```bash
cd apps/api
npm install
```

Then start the API using the script defined in `apps/api/package.json`.

---

## 🧪 Tests

The core matching and provider utility layers are tested with Vitest.

From the repository root:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

---

## 🗺️ Roadmap

### Core

- [x] Shared track model
- [x] Metadata normalization
- [x] Weighted matching engine
- [x] ISRC matching
- [x] Match confidence classification
- [x] Automated tests

### Spotify

- [x] PKCE authentication
- [x] User profile retrieval
- [x] Playlist library retrieval
- [x] Playlist pagination
- [x] Playlist ownership filters
- [x] Playlist search and sorting
- [x] Playlist details
- [x] Track retrieval
- [x] Track pagination
- [x] Spotify → PlaylistBridge track mapping

### Apple Music

- [x] Developer token backend
- [x] Apple Music catalog search
- [x] Apple Music → PlaylistBridge track mapping
- [x] Catalog integration with the matching engine
- [ ] MusicKit user authorization
- [ ] Apple Music library retrieval
- [ ] Apple Music playlist creation

### Conversion

- [x] Spotify → Apple Music analysis pipeline
- [x] Conversion progress UI
- [x] Match statistics
- [x] Conversion review
- [ ] Manual validation for uncertain matches
- [ ] Ignore / accept uncertain matches
- [ ] Final Spotify → Apple Music playlist transfer
- [ ] Apple Music → Spotify conversion
- [ ] Detailed conversion report

### Application

- [x] Feature-based React components
- [x] Spotify authentication hook
- [x] Spotify playlist hook
- [x] Conversion workflow hook
- [ ] Spotify session persistence
- [ ] Improved error handling
- [ ] OAuth state validation
- [ ] Spotify token refresh
- [ ] Landing / onboarding experience
- [ ] Final responsive pass
- [ ] Production deployment
- [ ] PWA / mobile application

---

## 🔐 Security

PlaylistBridge is designed to avoid exposing provider secrets in the frontend.

Spotify authentication uses PKCE and therefore does not require a client secret in the browser.

Apple developer signing credentials are handled outside the frontend application.

Sensitive files such as:

```text
.env
.env.local
*.p8
```

must never be committed to the repository.

Additional OAuth security improvements, including state validation and token lifecycle management, are planned before production deployment.

---

## 🎯 Project goals

PlaylistBridge is both a practical tool and a software engineering project exploring:

- third-party API integration
- OAuth authentication
- PKCE
- cross-platform data normalization
- fuzzy metadata matching
- confidence-based matching
- TypeScript architecture
- React architecture
- custom hooks
- automated testing
- resilient API pagination
- frontend / backend separation
- secure handling of provider credentials

The long-term goal is to make playlist migration **reliable, transparent and easy to review** instead of treating music transfer as a simple one-to-one API lookup.

---

## 📄 License

This project is currently under development.

License information will be added before the first public release.