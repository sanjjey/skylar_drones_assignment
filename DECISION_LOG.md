# Skylark Drones - Monday.com Business Intelligence Agent
## Architectural Decision Log & Strategic Trade-offs

---

### 1. Executive Summary & Purpose
Founders and executive leaders at Skylark Drones require immediate, high-fidelity business intelligence spanning top-of-funnel commercial momentum (**Deals Funnel**) and post-sale operational execution (**Work Order Tracker**). 

This Decision Log articulates the core engineering assumptions, architectural trade-offs, agentic reasoning models, and data governance practices designed to answer ambiguous executive queries accurately without hallucination or systemic fragility.

---

### 2. Key Assumptions Made

1. **Board Relational Linking & Identifiers**:
   - The primary relational join key across the two boards is `Deal Name` (in Deals) $\leftrightarrow$ `Deal name masked` (in Work Orders), supplemented by `Client Code` $\leftrightarrow$ `Customer Name Code`.
   - Work orders represent executed or in-progress projects resulting from closed-won deals, but organic/legacy operations may exist without a prior deal logged in the CRM.

2. **Sector & Taxonomy Heterogeneity**:
   - In raw business data, sector naming is fragmented (e.g. *Powerline*, *Powerlines*, *Energy*, *Solar*, *Renewable Energy*, *Mining*, *Mineral*).
   - We assumed a standardized canonical taxonomy:
     - `Energy & Powerlines`
     - `Renewables (Solar & Wind)`
     - `Mining & Minerals`
     - `Infrastructure & Construction`
     - `Oil & Gas`
     - `Agriculture & Forestry`

3. **Intelligent Cross-Table & Inter-Column Derivation**:
   - **Cross-Board Deal Value Imputation**: When a deal in Deals Funnel is missing `Masked Deal value`, the engine searches the Work Orders board for a matching `Deal Name`. If found, it imputes the value from the Work Order's `Amount in Rupees (Incl of GST)`. If unmatched, it derives the value from the **Sector-Stage Median Deal Size**.
   - **Empirical Stage-Based Probability Modeling**: When `Closure Probability` is unstated in CRM records, the engine derives confidence based on the deal's `Deal Stage` (e.g. *Lead Generated* = 10%, *Qualified* = 25%, *Demo* = 40%, *Feasibility* = 50%, *Proposal* = 60%, *Negotiation* = 80%, *Won / Received* = 100%, *Lost* = 0%).
   - **GST & Contract Tax Mathematical Derivation**: If Work Order `Amount (Excl of GST)` is missing, it is derived via GST tax laws as $\text{Amount (Incl GST)} / 1.18$.
   - **Accounts Receivable Derivation**: Derived deterministically as $\max(0, \text{Billed Value} - \text{Collected Cash})$.
   - **Sales Cycle Date Imputation**: Deals missing close dates derive expected dates from $\text{Created Date} + 60 \text{ days}$ standard sector lead time.

4. **Dynamic Schema & Fallback Operational Mode**:
   - While the production mode integrates dynamically with the **Monday.com GraphQL API (v2)**, evaluation and local development should be 100% resilient. If Monday.com credentials are not provided or rate-limited, the system seamlessly activates a sanitized local cache with visible audit badges.

---

### 3. Architecture & Trade-Offs Chosen

```
┌─────────────────────────────────────────────────────────────┐
│              Frontend (React + Vite + Tailwind)             │
│   • Executive KPI Ribbon  • Markdown & Recharts Chat Engine │
│   • Clarification Modals  • Data Governance Audit Drawer    │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API
┌──────────────────────────────▼──────────────────────────────┐
│                  Backend (FastAPI Engine)                   │
│   • Agent Orchestrator & Natural Language Intent Parser     │
│   • Deterministic BI Calculation Engine (Pandas Analytics)  │
│   • Data Resilience & Quality Normalization Pipeline        │
│   • Monday.com Dynamic GraphQL Client & In-Memory Cache     │
└─────────────────────────────────────────────────────────────┘
```

#### Trade-off 1: Tool-Augmented Deterministic BI Engine with Groq AI vs. Pure LLM Prompting
* **Why**: LLMs alone are prone to math hallucinations when calculating ad-hoc sums over hundreds of rows of financial data. Furthermore, local LLMs like Ollama introduce 5-10s latency per query.
* **Choice**: We implemented a hybrid architecture:
  1. Python/Pandas deterministic calculation tools execute exact aggregations (revenues, AR balances, win rates, weighted pipelines).
  2. **Groq AI (`llama-3.3-70b-versatile`)** provides near-instantaneous (<300ms) executive narrative synthesis and reasoning.
  3. Pluggable support for **Ollama** allows 100% offline air-gapped deployments if required by enterprise security policies.

#### Trade-off 2: In-Memory Resilient Cache vs. Persistent Vector Database
* **Why**: CRM board data changes periodically and is tabular in nature. Vector embeddings on individual rows lose aggregation capabilities (e.g., calculating the average closure probability of Q3 deals).
* **Choice**: Ingesting normalized board state into structured in-memory DataFrames provides microsecond query latency, exact multi-column joins, dynamic filtering, and eliminates expensive external database dependencies.

#### Trade-off 3: Dual-Mode Connection (Live Monday.com GraphQL + Resilient Fallback)
* **Why**: Reviewers evaluating the code locally may not have active Monday.com API tokens ready immediately.
* **Choice**: The architecture auto-detects Monday.com credentials from `.env`. If present, it executes live GraphQL queries; if absent, it loads the sanitized assignment dataset, ensuring instant testability without setup friction.

---

#### Trade-off 4: Supabase Session & Chat Storage vs. Ephemeral LocalStorage
* **Why**: Founders access executive BI dashboards across desktop, mobile, and collaborative board rooms. Browser `localStorage` is device-bound, fragile, and lacks real-time synchronization.
* **Choice**: We integrated **Supabase (PostgreSQL)** with an automated in-memory / local fallback:
  - `chat_sessions` stores conversation topics, timestamps, and metadata.
  - `chat_messages` stores the full structured multi-view chart payloads, data quality caveats, and AI responses.
  - Allows side-by-side session browsing and instant recall of historical inquiries.

#### Trade-off 5: Dynamic Multi-View Representation Engine
* **Why**: Different business questions require different cognitive representations:
  - Funnel velocity and sector comparisons are best seen in **Bar Charts**.
  - Revenue realization and pipeline progression are best understood in **Area Trend Charts**.
  - Execution status and software attach rates require **Donut / Proportional Share Charts**.
  - Detailed audit inspections require **Tabular Data Views** with CSV export capabilities.
* **Choice**: We engineered an interactive `MultiViewVisualizer` that automatically renders the most suitable default representation while giving the executive one-click toggles between **Bar, Trend, Donut, Table, and Metric Cards**.

We interpreted **"Leadership Updates"** as an executive decision-making artifact that bridges the gap between raw data and executive action. Rather than just printing a table of numbers, the Leadership Update generator produces a four-pillar briefing:

1. **Executive Snapshot**: Synthesizes pipeline velocity, closed-won bookings, cash collected, and collection efficiency into a concise founder-level narrative.
2. **Growth & Sector Momentum**: Identifies high-performing sectors and confidence-weighted pipeline opportunities.
3. **Strategic Risk Radar**: Automatically flags operational bottlenecks:
   - **Cash Flow Risk**: Total outstanding AR exposure and high-priority accounts requiring escalation.
   - **Execution Lag**: Closed-won deals that have not yet converted into operational work orders.
   - **Unbilled Backlog**: Projects in execution that have not yet generated billing invoices.
4. **Actionable Recommendations**: Clear directive bullet points for Finance, Key Account Managers (KAMs), and Operations teams.

---

### 5. What We Would Do Differently With More Time

1. **Write-Back Agent Capabilities**:
   - Enable the agent to trigger actions in Monday.com (e.g., post status updates to a deal, flag high-priority AR items, or create follow-up tasks for KAMs).
2. **Automated Scheduled Slack / Email Digests**:
   - Allow founders to subscribe to automated Monday morning leadership updates sent directly to a Slack channel or executive email.
3. **Predictive Churn & Win Modeling**:
   - Train an XGBoost or Random Forest model on historical deal cycle lengths, sector trends, and owner velocity to predict realistic deal close dates and collection delays.
4. **Granular Multi-Board Permissions**:
   - Implement role-based access control (RBAC) to ensure KAMs only query their assigned deals while founders access aggregated financials.

---

### 6. Data Governance & Caveat Summary
To maintain transparency, the agent surfaces data caveats alongside answers:
- **Zero/Unstated Deal Values**: Flagged when deals in the pipeline lack monetary estimation.
- **Missing Delivery Dates**: Highlighted to avoid misleading completion projections.
- **Overdue Close Dates**: Flagged as stale pipeline risk when tentative dates precede current dates.
