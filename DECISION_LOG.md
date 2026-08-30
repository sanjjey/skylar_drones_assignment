# SKYLARK DRONES — EXECUTIVE BI & AGENT PLATFORM
## Technical Decision Log & Architectural Rationale (2-Page Executive Summary)

---

### Executive Purpose
Founders and executive leaders at Skylark Drones require immediate, high-fidelity business intelligence spanning commercial momentum (**Deals Funnel**) and operational execution (**Work Order Tracker**). This document summarizes the core technical decisions, competitive trade-offs, data resilience strategies, and UX innovations implemented.

---

### 1. Tech Stack Selection & Competitive Trade-off Analysis

| Layer | Chosen Technology | Competitor Evaluated | Architectural Rationale & Trade-off Decisions |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | **React 18 + Vite + Tailwind CSS + Recharts** | *Streamlit / Retool* | Streamlit is rapid for basic data scripts but lacks modular multi-tab navigation, custom conversational drawers, and instant 1-click visual switching. React provides responsive enterprise modularity and sub-second rendering. |
| **Backend API** | **Python FastAPI + Pandas + Uvicorn** | *Flask / Django* | FastAPI provides asynchronous execution, auto-generated OpenAPI documentation, native Pydantic validation, and high-performance in-memory Pandas aggregations without Django's monolithic overhead. |
| **AI / LLM Brain** | **Groq Cloud API (`llama-3.3-70b-versatile`)** | *Gemini / Ollama* | Gemini free tiers suffer severe rate limits (HTTP 429) on high-frequency BI tasks. Ollama has 5–10s local latency. Groq's LPU acceleration delivers sub-300ms inference with large context windows. |
| **Database & Persistence** | **Supabase (PostgreSQL + REST Client)** | *Self-hosted Postgres / LocalStorage* | Eliminates infrastructure overhead while providing managed relational tables, instant REST APIs, and multi-session persistence with client-side fallback on maintenance. |
| **Data Pipeline** | **Monday.com GraphQL v2 + Resilient Cache** | *Static Hardcoded CSV* | Live GraphQL v2 schema discovery connects directly to active Deal Funnel and Work Order boards, with automatic fallback to a normalized local cache to ensure 100% evaluation uptime. |

---

### 2. Data Normalization & 3-Tier Missing Value Resilience Framework

Real-world CRM data contains unstated deal values, missing completion dates, and unstructured sectors. Instead of dropping records or guessing, the system applies a **3-Tier Derivation Engine**:

| Tier Level | Mathematical / Empirical Strategy | Application in Skylark Datasets |
| :--- | :--- | :--- |
| **Tier 1: Inter-Column Math** | Exact intra-row arithmetic and standard sales lead time formulas. | • **GST Separation**: $\text{Amount (Excl. GST)} = \frac{\text{Amount (Incl. GST)}}{1.18}$<br>• **Deterministic AR**: $\text{AR} = \max(0, \text{Billed} - \text{Collected Cash})$<br>• **Sales Cycle**: $\text{Tentative Close Date} = \text{Created Date} + 60\text{ days}$ |
| **Tier 2: Pattern Matching & Entity Linking** | Entity cross-referencing between sales opportunities and operational contracts. | • **Deals missing monetary value** match Work Orders by `Deal Name` to copy confirmed contract amounts.<br>• **Stage-Based Win Rates**: *Lead=10%*, *Qualified=25%*, *Demo=40%*, *Proposal=60%*, *Negotiations=80%*, *Won=100%*, *Lost=0%*. |
| **Tier 3: Statistical Median Fallback** | Median imputation across sector clusters to prevent outlier distortion. | • Deals lacking entity matches inherit historical **Sector Median Deal Size** (*Mining*: ₹12.8L, *Energy*: ₹18.5L, *Renewables*: ₹4.8L), with global portfolio median fallback. |

---

### 3. Executive UX & Platform Capabilities

| Feature Innovation | Mechanism Implemented | Strategic Business Benefit |
| :--- | :--- | :--- |
| **Executive KPI Ribbon & Risk Radar** | Persistent top ribbon tracking Open Pipeline, Weighted Value, Won Bookings, AR Exposure, and Software Attach rate. | Eliminates prompt fatigue; provides founders instant passive visibility into cash flow risks and overdue deliverables. |
| **1-Click Multi-View Visualizer** | Dynamic mode switcher (Bar Chart, Area Timeline Trend, Donut Pie Share, Data Grid, Metric Cards). | Allows executives to pivot between high-level visual distributions and granular audit records without sending follow-up prompts. |
| **Interactive Board Explorer** | Dedicated top tab with live multi-dimensional filters (Sector, Stage, Quarter, Search) and 1-click CSV Export. | Empowers operations and sales teams to explore, slice, and export raw CRM data without touching complex SQL queries. |
| **Full CRUD Chat Management** | Sidebar thread creation, inline title renaming, prompt editing, and message truncation (Undo Last). | Allows topic-isolated research (e.g. Q3 Cash Flow vs Energy Pipeline) with cross-device cloud persistence. |
| **Dual Chatbot Architecture** | Core Executive Monday.com BI Agent + Floating App Navigator Widget (bottom-right). | The App Navigator assists users in finding features and running health audits, while the core BI Agent handles deep analytical inquiries. |
