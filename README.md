# ReadShift

A behaviorally and affectively adaptive reading interface that tracks how you read — not just what you read.

## What it does

Most reading apps treat every session identically. ReadShift observes how you're actually reading — scroll velocity, paragraph dwell time, re-read patterns — and adapts the interface in real time to support better comprehension.

**Before you read:** A lightweight sharpness check-in captures your affective state. Low sharpness automatically enables focused mode.

**While you read:** Passive behavioral signals drive three adaptive interface states:
- **Default** — clean reading environment, warm off-white background
- **Focused mode** — wider column, larger text, cream background. Triggered by struggle signals.
- **Skimming mode** — tighter layout, section summary prompt. Triggered by fast scroll velocity.

**After you read:** A post-read reflection card captures session quality. Behavioral data is aggregated into an insight dashboard showing paragraph-level engagement, best reading times, and re-read patterns.

## Research background

ReadShift is grounded in five academic papers:

- **Li et al. (2010)** — Stage-based model of personal informatics. ReadShift is designed holistically across all five stages: preparation, collection, integration, reflection, and action.
- **Mills et al. (2020)** — Eye-Mind Reader. Demonstrated that real-time behavioral detection during reading improves long-term comprehension. ReadShift implements a scalable, hardware-free approximation using browser-native APIs.
- **McNamara et al. (2022)** — iSTART intelligent tutoring system. Introduced the concept of stealth assessment — evaluating comprehension through behavioral signals without interrupting the learning experience.
- **Picard (1997)** — Affective Computing. Foundational argument that emotional state is not peripheral to cognition but central to it.
- **Tati (2025)** — Digital reading engagement. Qualitative evidence that fatigue, emotional state, and environmental factors materially affect reading comprehension.

## Tech stack

**Frontend**
- React 19 + Vite
- Tailwind CSS v4
- Zustand (auth state)
- React Router v7
- Axios

**Backend**
- Node.js + Express
- PostgreSQL
- JWT authentication
- @mozilla/readability (article parsing)

## Database schema
users                 — authentication
articles              — imported article content + paragraph data
reading_sessions      — per-session data including pre-read sharpness
behavioral_events     — scroll velocity, dwell time, re-read events
comprehension_scores  — post-read question results

## Behavioral signals tracked

| Signal | Detection method | What it means |
|---|---|---|
| Paragraph dwell time | Intersection Observer API | Time spent on each paragraph |
| Re-read detection | Scroll direction reversal | Comprehension difficulty |
| Scroll velocity | Scroll event delta / time | Skimming vs engaged reading |
| Session drop-off | Page Visibility API | Abandonment point |
| Pre-read sharpness | Self-report (1–5) | Affective state before reading |

## Local setup

**Prerequisites**
- Node.js 20+
- PostgreSQL 16+

**1 — Clone the repository**
```bash
git clone https://github.com/yourusername/readshift.git
cd readshift
```

**2 — Install dependencies**
```bash
npm install
cd client && npm install
cd ../server && npm install
```

**3 — Set up the database**
```bash
psql -U postgres
CREATE DATABASE readshift;
\c readshift
```

Then run the schema:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  url TEXT,
  title TEXT,
  content TEXT,
  paragraphs JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  pre_sharpness INTEGER CHECK (pre_sharpness BETWEEN 1 AND 5),
  post_rating INTEGER CHECK (post_rating BETWEEN 1 AND 5),
  completed BOOLEAN DEFAULT FALSE
);

CREATE TABLE behavioral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES reading_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  paragraph_id TEXT,
  value FLOAT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comprehension_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES reading_sessions(id) ON DELETE CASCADE,
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**4 — Configure environment variables**

Create `server/.env`:

PORT=5000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/readshift
JWT_SECRET=your_jwt_secret_here

**5 — Run the app**
```bash
cd ..
npm run dev
```

Frontend runs on http://localhost:5173
Backend runs on http://localhost:5000

## Project structure

readshift/
├── client/
│   ├── src/
│   │   ├── api/          — axios instance with JWT interceptor
│   │   ├── components/   — ProtectedRoute
│   │   ├── hooks/        — behavioral tracking hooks
│   │   │   ├── useEventLogger.js
│   │   │   ├── useParagraphTracker.js
│   │   │   ├── useRereadDetector.js
│   │   │   └── useScrollVelocity.js
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Reader.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Heatmap.jsx
│   │   └── store/        — Zustand auth store
│   └── package.json
├── server/
│   ├── middleware/       — JWT authentication
│   ├── routes/
│   │   ├── auth.js       — register + login
│   │   ├── articles.js   — import + fetch articles
│   │   ├── sessions.js   — create + end reading sessions
│   │   ├── events.js     — batch behavioral event logging
│   │   └── insights.js   — dashboard aggregation + heatmap data
│   ├── db.js             — PostgreSQL connection pool
│   └── index.js          — Express app entry point
└── package.json          — runs both servers with npm run dev

## HCI research contribution

ReadShift addresses a gap identified by Mills et al. (2020): existing adaptive reading systems require laboratory-grade eye-tracking hardware that limits real-world deployment. ReadShift achieves similar goals using browser-native APIs — the Intersection Observer API for paragraph dwell time and scroll event listeners for velocity detection — making adaptive reading intervention accessible without specialist equipment.

The paragraph heatmap visualisation surfaces what Li et al. (2010) call the reflection stage of personal informatics: giving users a concrete, actionable view of their own reading behavior that they cannot perceive through self-reflection alone.

## Ethical considerations

ReadShift collects sensitive behavioral data. Key design decisions made in response:

- All data collection is disclosed explicitly in the Data and Privacy settings screen
- Users can export or delete all their data at any time
- JWT tokens expire after 7 days
- No behavioral data is shared with third parties
- The pre-read sharpness check-in is optional — users can skip it

## Author

Tanisi Das
Computer Science Honours, Carleton University
HCI Portfolio Project — 2026