# 🚁 Skylark Drones - Executive Business Intelligence & Agentic Platform

A full-stack, enterprise-grade Executive Business Intelligence and conversational analytics system built for **Skylark Drones**. The platform integrates seamlessly with **Monday.com CRM (Deals Funnel)** and **Operations (Work Order Tracker)** boards, executes deterministic financial/operational calculations, employs a **3-Tier Missing Value Derivation Engine**, and provides multi-modal visualizations (Bar, Area Trend, Donut Pie, Data Table, Metric Cards).

---

## 🌟 Key Architecture & Capabilities

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         SKYLARK BI PLATFORM ARCHITECTURE                         │
├──────────────────────────────────────────────────────────────────────────────────┤
│ 1. Frontend (React 18 + Vite + Tailwind CSS + Lucide Icons + Recharts)           │
│    • Dual Chatbot System:                                                        │
│      - Chatbot 1: Floating App Navigator & Feature Helper (bottom-right)        │
│      - Chatbot 2: Core Executive Monday.com BI Intelligence Agent                │
│    • Interactive Board Explorer & Analytics Hub (Filterable Data Grid)           │
│    • MultiView Visualizer (Bar, Area Trend, Donut Pie, Grid Table, Metric Cards) │
│    • Session History Sidebar with Inline Renaming, Undo & Edit Message Controls  │
│    • Executive Leadership Briefing Modal & Data Governance Health Drawer         │
├──────────────────────────────────────────────────────────────────────────────────┤
│ 2. Backend (FastAPI + Pandas + Groq AI Llama-3.3-70B + httpx)                    │
│    • Deterministic Business Intelligence & KPI Engine                            │
│    • 3-Tier Missing Value Imputation & Resilience Pipeline                       │
│    • Monday.com GraphQL v2 Client with Schema Discovery & Local Fallback Cache   │
│    • Multi-dimensional Board Filtering & CSV Data Export Engine                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│ 3. Database & Cloud Persistence (Supabase PostgreSQL)                            │
│    • Chat Sessions & Conversation History Persistence                            │
│    • Auto-fallback to In-Memory session state on maintenance/network drops       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ 3-Tier Missing Value Imputation Framework

Instead of dropping records or assigning static zeros, the platform uses a mathematical and empirical 3-tier imputation engine:

| Tier | Strategy | Method & Rules Applied |
| :--- | :--- | :--- |
| **Tier 1** | **Inter-Column Mathematical Calculations** | - **GST Exclusion**: $\text{Amount (Excl. GST)} = \frac{\text{Amount (Incl. GST)}}{1.18}$<br>- **Deterministic AR**: $\text{AR} = \max(0, \text{Billed} - \text{Collected Cash})$<br>- **Unbilled Backlog**: $\text{Backlog} = \max(0, \text{Contract} - \text{Billed})$<br>- **Sales Lead Time**: $\text{Tentative Close} = \text{Created Date} + 60\text{ days}$ |
| **Tier 2** | **Pattern Matching & Entity Cross-Referencing** | - **Cross-Board Link**: Matches Deal Name $\leftrightarrow$ Work Order Contract Amount.<br>- **Empirical Stage Heuristics**: Maps win rates to funnel stages:<br>  *Lead=10%*, *Qualified=25%*, *Demo=40%*, *Proposal=60%*, *Negotiation=80%*, *Won=100%*, *Lost=0%*. |
| **Tier 3** | **Statistical Fallbacks** | - Imputes historical **Sector Median Deal Size** (*Mining*, *Energy*, *Renewables*, *Infrastructure*).<br>- Global portfolio median fallback for uncategorized deals. |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, React Markdown (`remark-gfm`), Lucide React.
- **Backend**: Python 3.11+, FastAPI, Uvicorn, Pandas, NumPy, Groq SDK (`llama-3.3-70b-versatile`), httpx, Pydantic v2.
- **Database**: Supabase (PostgreSQL).
- **APIs**: Monday.com GraphQL API v2, Groq Cloud API.
- **Testing**: Pytest, Asyncio Pytest Suite (19 automated tests).

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment (optional)
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Run FastAPI backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Backend API will be running at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```
Frontend application will be accessible at `http://localhost:5173`.

---

## 🧪 Automated Testing

Run the comprehensive unit, prompt-following, and integration test suite:
```bash
cd backend
python -m pytest tests
```

Output:
```bash
======================= 19 passed in 3.10s =======================
```

---

## ☁️ Deployment Guide

### Option A: Deploy Backend to Railway / Render

#### 1. Railway.app (Recommended)
1. Go to [Railway.app](https://railway.app) $\rightarrow$ **New Project** $\rightarrow$ **Deploy from GitHub repo**.
2. Select your repository.
3. In service settings, set:
   - **Root Directory**: `backend`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   ```env
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=llama-3.3-70b-versatile
   MONDAY_API_KEY=your_monday_api_token
   MONDAY_DEALS_BOARD_ID=your_deals_board_id
   MONDAY_WORK_ORDERS_BOARD_ID=your_work_orders_board_id
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. Click **Generate Domain** to get your live backend URL (e.g. `https://skylark-backend-production.up.railway.app`).

#### 2. Render.com
1. Create a new **Web Service** on [Render.com](https://render.com).
2. Connect your repo and set:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add the environment variables listed above and deploy.

---

### Option B: Deploy Frontend to Vercel

1. Go to [Vercel.com](https://vercel.com) $\rightarrow$ **Add New Project**.
2. Import your GitHub repository.
3. Configure the build settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   ```env
   VITE_API_URL=https://your-railway-or-render-backend-url.com
   ```
5. Click **Deploy**.

---

### Option C: Database Setup (Supabase)

1. Create a project at [Supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in the Supabase dashboard.
3. Copy and run the script in [`supabase_schema.sql`](file:///d:/skylar_drone_simple/supabase_schema.sql):
   ```sql
   -- Creates chat_sessions and chat_messages tables with automatic updated_at trigger
   ```
4. Copy your project URL and Anon API key into `backend/.env`.

---

## 📊 Example Executive Inquiries to Try

- `"What are the derived values that are missing in a scrollable table"`
- `"How are missing values handled in our dataset?"`
- `"Can you show the tentative dates for different sectors using trend"`
- `"Generate pie chart of work orders by execution status"`
- `"Generate pie chart of active pipeline by sector"`
- `"How's our pipeline looking for the energy sector this quarter?"`
- `"What is our total outstanding AR and which accounts are top priority?"`
- `"Correlate our closed-won deals with work order execution status"`
- `"Prepare data for leadership update briefing"`

---

## 📄 Deliverables & Documentation
- [`DECISION_LOG.md`](file:///d:/skylar_drone_simple/DECISION_LOG.md): Comprehensive 2-page decision log detailing assumptions, trade-offs, architecture decisions, and leadership briefing synthesis.
- [`supabase_schema.sql`](file:///d:/skylar_drone_simple/supabase_schema.sql): Database schema migration script.
