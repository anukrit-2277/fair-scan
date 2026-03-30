# FairScan

**Unbiased AI Decision-Making Platform**

> Inspect. Explain. Fix. Monitor.

FairScan is a web-based AI fairness auditing platform built on Google Cloud (Vertex AI + Gemini). It enables organisations to detect hidden bias in datasets and ML models, explain findings in plain language, apply one-click debiasing, and continuously monitor deployed models for fairness drift.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Redux Toolkit, Vite |
| Backend | Node.js, Express 5, MongoDB (Mongoose) |
| AI Services | Gemini API, Vertex AI (Explainability, Pipelines, Monitor) |
| Auth | JWT + bcrypt |

## Project Structure

```
Fair-Scan/
├── client/                     # React SPA (Vite)
│   └── src/
│       ├── app/                # Store, router
│       ├── components/         # Shared UI components
│       │   ├── common/         # Button, Card, Badge, Logo
│       │   └── layout/         # Sidebar, Topbar, DashboardLayout
│       ├── features/           # Feature modules
│       │   ├── auth/           # Authentication
│       │   ├── dashboard/      # Dashboard home
│       │   └── landing/        # Landing page
│       ├── hooks/              # Custom React hooks
│       ├── services/           # API client (Axios)
│       ├── styles/             # Design tokens, reset, utilities
│       └── utils/              # Helpers
│
├── server/                     # Express API
│   └── src/
│       ├── config/             # Environment, database
│       ├── controllers/        # Route handlers
│       ├── middleware/          # Auth, error handling, validation
│       ├── models/             # Mongoose schemas
│       ├── routes/             # Express routers
│       ├── services/           # Business logic
│       │   └── ai/            # Gemini + Vertex AI clients
│       └── utils/              # Async handler, API response helpers
│
└── FairScan_Project_Brief.md   # Full project specification
```

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Google Cloud project (for Vertex AI + Gemini)

### Installation

```bash
# Clone
git clone <repo-url>
cd Fair-Scan

# Server
cd server
cp .env.example .env    # Edit with your values
npm install
npm run dev

# Client (in a new terminal)
cd client
cp .env.example .env
npm install
npm run dev
```

The client runs on `http://localhost:5173` and the API on `http://localhost:5000`.

### API Health Check

```bash
curl http://localhost:5000/api/health
```

## Design System

The UI is built on a custom design token system (`client/src/styles/tokens.css`) using CSS custom properties:

- **Color palette**: Cool-toned dark slate with electric indigo accents
- **Typography**: Inter font family, modular scale
- **Spacing**: 8px grid system
- **Components**: Button, Card, Badge, Logo (all with variant + size props)

## License

MIT
