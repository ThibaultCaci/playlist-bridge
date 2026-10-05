# 🎵 PlaylistBridge

PlaylistBridge is an open-source application designed to transfer playlists between music streaming platforms.

The project currently focuses on **Spotify ↔ Apple Music**, with the goal of providing reliable track matching even when metadata differs slightly between platforms.

> 🚧 PlaylistBridge is currently under active development.

---

## ✨ Features

### Spotify

- OAuth 2.0 authentication with PKCE
- Spotify playlist library retrieval
- Automatic pagination for large playlist libraries
- Playlist track retrieval with pagination
- Spotify track normalization into a platform-independent format
- ISRC extraction when available
- Support for playlists containing hundreds of tracks

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

This allows PlaylistBridge to avoid blindly selecting the first search result returned by another music provider.

### Apple Music

Apple Music integration is planned and the project architecture is already designed to support multiple providers.

Real Apple Music API integration requires Apple Music / MusicKit developer credentials and is therefore not enabled yet.

---

## 🏗️ Architecture

PlaylistBridge is organized as a monorepo:

```text
playlist-bridge/
├── apps/
│   └── web/               # React + Vite web application
│
├── packages/
│   ├── core/              # Shared models and matching engine
│   ├── spotify/           # Spotify API integration
│   └── apple-music/       # Apple Music integration
│
├── package.json
├── tsconfig.json
└── README.md
```

The application separates provider-specific APIs from the core conversion logic.

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
│     Apple Music     │
└─────────────────────┘
```

This architecture makes it possible to add additional music providers without coupling the matching logic to a specific API.

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

Additional safeguards reduce the score when:

- ISRCs conflict
- artists do not match
- track durations differ significantly

The resulting match is classified according to confidence:

```text
score >= 0.90       → matched
0.70 <= score < .90 → uncertain
score < 0.70        → unmatched
```

---

## 🟢 Spotify integration

Spotify authentication uses the **OAuth 2.0 Authorization Code flow with PKCE**.

No Spotify client secret is exposed in the frontend.

The current Spotify implementation supports:

```text
Authenticate user
        ↓
Load Spotify profile
        ↓
Load complete playlist library
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

## 🛠️ Tech stack

- TypeScript
- React
- Vite
- Spotify Web API
- Apple Music API / MusicKit *(planned)*
- Vitest
- OAuth 2.0
- PKCE

---

## 🚀 Getting started

### Requirements

- Node.js
- npm
- Spotify Developer application

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

> Never commit `.env.local` or API credentials to Git.

### Start the web application

From `apps/web`:

```bash
npm run dev
```

Then open the local URL displayed by Vite.

---

## 🧪 Tests

The matching and Spotify utility layers are tested with Vitest.

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

- [x] Core track model
- [x] Metadata normalization
- [x] Track matching engine
- [x] Spotify PKCE authentication
- [x] Spotify user authentication
- [x] Spotify playlist library
- [x] Spotify playlist pagination
- [x] Spotify track retrieval
- [x] Spotify track pagination
- [x] Spotify → PlaylistBridge track mapping
- [ ] Apple Music authentication
- [ ] Apple Music library retrieval
- [ ] Apple Music catalog search
- [ ] Apple Music → PlaylistBridge track mapping
- [ ] Spotify → Apple Music conversion
- [ ] Apple Music → Spotify conversion
- [ ] Conversion progress UI
- [ ] Manual review for uncertain matches
- [ ] Conversion report
- [ ] Mobile application

---

## 🔐 Security

PlaylistBridge is designed to avoid exposing provider secrets in the frontend.

Spotify authentication uses PKCE and therefore does not require a client secret in the browser.

Future Apple Music integration will keep private signing keys outside of the client application.

Sensitive credentials and local environment files must never be committed to the repository.

---

## 🎯 Project goals

PlaylistBridge is both a practical tool and a software engineering project exploring:

- third-party API integration
- OAuth authentication
- PKCE
- cross-platform data normalization
- fuzzy metadata matching
- TypeScript architecture
- automated testing
- resilient API pagination
- React application development

The long-term goal is to make playlist migration reliable, transparent and easy to review instead of treating music transfer as a simple one-to-one API lookup.

---

## 📄 License

This project is currently under development.

License information will be added before the first public release.