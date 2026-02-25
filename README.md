# 🛡️ AutoSOC — AI-Powered Security Operations Platform

> *Giving small businesses a Fortune 500 security team for $500/month using AI.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Node 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-teal.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED.svg)](https://www.docker.com/)
[![CI/CD](https://github.com/achavellir/autosoc/actions/workflows/ci.yml/badge.svg)](https://github.com/achavellir/autosoc/actions)

---

## 🚀 What is AutoSOC?

AutoSOC is an AI-powered Security Operations Center (SOC) platform designed for small and medium businesses (SMBs) that can't afford a full security team. It monitors your systems 24/7, detects threats, auto-responds to incidents, and delivers plain-English reports — all powered by AI.

### The Problem
- 43% of cyberattacks target SMBs
- Average breach cost: **$200,000**
- A real SOC team costs: **$300,000+/year**
- Most SMBs have **zero** security coverage

### The Solution
AutoSOC = AI + Expert Oversight at **$299–$1,999/month**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT SYSTEMS                     │
│         (Servers, Endpoints, Cloud, Network)         │
└──────────────────────┬──────────────────────────────┘
                       │ Logs & Events
                       ▼
┌─────────────────────────────────────────────────────┐
│                  DATA INGESTION LAYER                │
│         Wazuh SIEM + Custom Log Collectors           │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                    AI ENGINE                         │
│    Threat Detection → Triage → Response Planning     │
│         (OpenAI GPT-4 / Claude API)                  │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌─────────────────┐      ┌─────────────────────────┐
│  AUTO-RESPONSE  │      │   HUMAN ANALYST REVIEW  │
│  (Quarantine,   │      │   (PhD-level oversight) │
│   Block, Alert) │      │                         │
└─────────────────┘      └─────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                  CLIENT DASHBOARD                    │
│     Plain-English Reports + Real-time Monitoring     │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
autosoc/
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # API entry point
│   ├── models/                 # Database models
│   ├── routers/                # API routes
│   ├── services/               # Business logic
│   │   ├── threat_detector.py  # AI threat detection
│   │   ├── alert_triage.py     # AI alert prioritization
│   │   ├── auto_response.py    # Automated remediation
│   │   └── report_generator.py # AI report generation
│   └── requirements.txt
├── frontend/                   # React dashboard
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Dashboard pages
│   │   └── hooks/              # Custom React hooks
│   └── package.json
├── ai/                         # AI models & prompts
│   ├── prompts/                # System prompts
│   ├── fine_tuning/            # Training data
│   └── threat_intel/           # Threat intelligence data
├── scripts/                    # Setup & deployment scripts
│   ├── setup.sh                # One-click setup
│   ├── deploy.sh               # Deployment script
│   └── ingest_logs.py          # Log ingestion utility
├── docs/                       # Documentation
│   ├── API.md                  # API documentation
│   ├── DEPLOYMENT.md           # Deployment guide
│   └── BUSINESS_PLAN.md        # Business plan
├── docker-compose.yml          # Full stack deployment
├── .env.example                # Environment variables template
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- OpenAI API Key (or Anthropic API Key)

### 1. Clone & Setup
```bash
git clone https://github.com/achavellir/autosoc.git
cd autosoc
cp .env.example .env
# Edit .env with your API keys
```

### 2. Start with Docker (Recommended)
```bash
docker-compose up -d
```

### 3. Or Run Locally
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### 4. Access Dashboard
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- API: http://localhost:8000

---

## 🔑 Core Features

### 1. 🔍 AI Threat Detection
- Monitors logs from servers, endpoints, firewalls, cloud
- AI classifies every event: benign / suspicious / critical
- Reduces 1,000+ daily alerts to 5 actionable threats

### 2. 🧠 Intelligent Alert Triage
- GPT-4/Claude analyzes context around each alert
- Assigns severity: P1 (Critical) → P4 (Low)
- Groups related alerts into single incidents

### 3. ⚡ Auto-Response Engine
- P1 threats: Automatic quarantine/block
- P2 threats: Alert + suggested actions
- P3/P4: Log + weekly report

### 4. 📊 Plain-English Reports
- Weekly executive summary (no jargon)
- "Here's what happened, here's what we did, here's your risk level"
- Compliance status (HIPAA, SOC2, PCI-DSS)

### 5. 🎯 Phishing Simulation
- Monthly AI-generated phishing tests
- Tracks who clicks, who reports
- Auto-trains staff based on results

---

## 💰 Pricing Tiers (Business Model)

| Plan | Price | Clients | Endpoints |
|------|-------|---------|-----------|
| Starter | $299/mo | Solo/tiny biz | Up to 10 |
| Growth | $799/mo | 10–50 employees | Up to 50 |
| Pro | $1,999/mo | 50–200 employees | Up to 200 |
| Enterprise | Custom | 200+ | Unlimited |

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** — High-performance Python API
- **PostgreSQL** — Primary database
- **Redis** — Caching & job queues
- **Celery** — Background task processing
- **Wazuh** — Open-source SIEM integration

### AI Layer
- **OpenAI GPT-4** — Threat analysis & report generation
- **LangChain** — AI orchestration
- **Pinecone** — Vector DB for threat intelligence
- **Custom fine-tuned models** — CVE/threat classification

### Frontend
- **React 18** — UI framework
- **Recharts** — Security dashboards
- **TailwindCSS** — Styling
- **Socket.io** — Real-time alerts

### Infrastructure
- **Docker** — Containerization
- **AWS/GCP** — Cloud deployment
- **Nginx** — Reverse proxy
- **Let's Encrypt** — SSL

---

## 🚀 Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for full production deployment guide.

Quick deploy to AWS:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh --env production --cloud aws
```

---

## 📖 API Documentation

See [API.md](docs/API.md) or visit `/docs` when running locally.

Key endpoints:
```
POST /api/v1/alerts/ingest     — Ingest log events
GET  /api/v1/alerts            — Get all alerts
POST /api/v1/alerts/{id}/triage — AI triage an alert
GET  /api/v1/reports/weekly    — Get weekly report
POST /api/v1/scan/phishing     — Launch phishing sim
GET  /api/v1/compliance/status — Compliance dashboard
```

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📜 License

MIT License — see [LICENSE](LICENSE)

---

## 👤 Author

**achavellir** — PhD Cybersecurity Researcher
- GitHub: [@achavellir](https://github.com/achavellir)
- Project: [github.com/achavellir/autosoc](https://github.com/achavellir/autosoc)

---

## ⭐ Star this repo if you find it useful!

*"A breach costs $200K on average. We charge $800/month. The math speaks for itself."*
