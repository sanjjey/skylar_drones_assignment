# SKYLARK DRONES ASSIGNMENT
## Decision Log & Architectural Rationale

---

### Executive Summary & Purpose
Founders and executive leaders at Skylark Drones require immediate, high-fidelity business intelligence spanning top-of-funnel commercial momentum (**Deals Funnel**) and post-sale operational execution (**Work Order Tracker**). 

This Decision Log articulates the core engineering choices, technology comparisons against competitors, data normalization strategies, handling of null values, and user experience innovations implemented in the platform.

---

### 1. SELECTING THE TECH STACK

#### Summary of Chosen Technologies:
* **Frontend**: React.js / Next.js (Tailwind CSS, Lucide Icons, Recharts)
* **Backend**: Python - FastAPI (Pandas, Uvicorn, Pydantic)
* **The LLM / Agent Brain**: Groq (using API with `llama-3.3-70b-versatile`)
* **Database**: Supabase (PostgreSQL with real-time REST client & SQL Editor)
* **Deployment**: Vercel (Frontend), Railway (Backend)
* **Live Data Monitoring**: Monday.com (GraphQL API v2 with resilient local fallback)

#### Why Did I Choose Each Technology Instead of Its Competitors?

1. **React.js and Next.js**:
   * **a.** Is the most sophisticated combination that can be integrated easily and has more options, high-quality UI components that can make the whole system more professional, technical, and versatile.
   * **b.** And its competitor Streamlit is good at representing data visualization, offers easy deployment and integrates smoothly with Python. However, the sophisticated look will be missed, and the versatility and flexibility are very low for custom executive workflows, responsive tabbed navigation, dynamic modal dialogs, and real-time visualization toggles.

2. **Python-FastAPI**:
   * **a.** Is chosen due to its simplistic and understandable coding structure while delivering high-performance asynchronous request handling.
   * **b.** It is majorly used in industry-standard project developments compared to Flask, providing automatic OpenAPI (Swagger) documentation, native Pydantic type validation, and superior speed.
   * **c.** I could have gone with Django, but Django is heavier and does not give the lightweight flexibility that FastAPI gives for microservices and data-intensive agent API backends.

3. **Groq (using API)**:
   * **a.** Is equipped with the `llama-3.3-70b-versatile` model that is very fast in responding (sub-300ms token execution speed), with a large context window that can handle data that is large in size easily compared to others.
   * **b.** Gemini is a good competitor, and why I didn't go with Gemini as the primary LLM provider is due to its low token count per minute limits in standard tiers, leading to frequent HTTP 429 (Too Many Requests) rate-limit errors during continuous, multi-turn data analytics tasks.
   * **c.** Compared to local Ollama execution: Ollama offers high privacy but suffers from 5-10 second latency per query on standard hardware, breaking the instant executive conversational experience provided by Groq's LPU acceleration.

4. **Supabase**:
   * **a.** As the requirement says, there should be no complex setup done. The most important thing is storing values—where should chat histories, session states, and metadata get stored reliably?
   * **b.** To address that, Supabase is very highly recommended as it provides almost all the possible backend services out-of-the-box, including PostgreSQL tables, interactive SQL editors, instant REST APIs, real-time subscriptions, and built-in authentication services (optional).
   * **c.** It eliminates the need to host, manage, or configure standard PostgreSQL instances manually while ensuring cloud persistence across devices.

5. **Deployment (Vercel & Railway)**:
   * **a.** **Vercel** provides native zero-configuration deployments for Next.js and React frontend applications with edge CDN acceleration and instant preview links.
   * **b.** **Railway** provides a robust, seamless environment for hosting Python FastAPI backends, managing environment variables, auto-deploying from Git commits, and monitoring container logs without DevOps complexity.

6. **Live Data Monitoring (Monday.com)**:
   * **a.** Integrates directly via GraphQL API v2 to query live CRM boards (*Deals Funnel* and *Work Order Tracker*) for real-time commercial and operational visibility.
   * **b.** Features an in-memory resilient fallback cache that automatically activates if Monday.com API tokens are absent or rate-limited, guaranteeing 100% evaluation uptime without setup friction.

---

### 2. DATA NORMALIZATION & HANDLING NULL VALUES

Real-world CRM data from sales teams and operations boards often contains inconsistent formatting, heterogeneous taxonomies, unstated financial values, and blank delivery schedules. Below is the breakdown of how normalization and null value handling were executed and why specific methods were chosen.

#### A. Sector Taxonomy Normalization
* **Problem**: Raw data contained fragmented sector names across boards (e.g., *Powerline*, *Powerlines*, *Energy*, *Solar*, *Renewable Energy*, *Mining*, *Mineral*). Querying sector performance directly would cause fragmented totals across duplicate names.
* **Solution**: Implemented a canonical taxonomy normalization dictionary mapping all raw sector strings into 6 standardized categories:
  1. `Energy & Powerlines`
  2. `Renewables (Solar & Wind)`
  3. `Mining & Minerals`
  4. `Infrastructure & Construction`
  5. `Oil & Gas`
  6. `Agriculture & Forestry`
* **Why Chosen**: Guarantees clean aggregations in visual charts and ensures AI intent parsing yields accurate sector metrics without missing split data records.

#### B. Null & Missing Value Imputation Strategies

1. **Cross-Board Value Imputation (Deals $\leftrightarrow$ Work Orders)**:
   * **Method**: When a deal record in the Deals Funnel board lacks a `Masked Deal Value`, the engine searches the Work Order Tracker board for a matching `Deal Name`. If found, it imputes the deal value from the Work Order's `Amount in Rupees (Incl of GST)`.
   * **Why Chosen**: Work orders represent executed contracts. Using confirmed work order financial amounts is significantly more accurate than leaving deal values as zero or making blind guesses.

2. **Sector-Stage Median Imputation**:
   * **Method**: If a deal has no monetary value in the CRM and no matching work order exists, the value is imputed using the median deal size of historical deals within the same sector and pipeline stage.
   * **Why Chosen**: Prevents unstated deal values from distorting pipeline metrics to 0 while avoiding outlier distortion caused by arithmetic means. Median imputation provides a statistically grounded baseline.

3. **Empirical Stage-Based Probability Derivation**:
   * **Method**: When `Closure Probability` is missing in CRM entries, the system derives confidence percentages deterministically based on pipeline stage (*Lead Generated* = 10%, *Qualified* = 25%, *Demo* = 40%, *Feasibility* = 50%, *Proposal* = 60%, *Negotiation* = 80%, *Won / Received* = 100%, *Lost* = 0%).
   * **Why Chosen**: Weighted pipeline values ($\text{Deal Value} \times \text{Closure Probability}$) require a non-null confidence metric for every open deal. Stage-based empirical mapping aligns with standard sales engineering practices.

4. **Mathematical Tax & Receivable Derivations**:
   * **Method (GST)**: If `Amount (Excl of GST)` is null in Work Orders, it is calculated mathematically as $\text{Amount (Incl GST)} / 1.18$.
   * **Method (AR Exposure)**: Outstanding Accounts Receivable is calculated deterministically as $\max(0, \text{Billed Value} - \text{Cash Collected})$.
   * **Why Chosen**: Eliminates human entry errors and provides strict financial integrity compliance based on tax laws.

5. **Sales Cycle Close Date Imputation**:
   * **Method**: Deals missing an expected close date derive the date as $\text{Created Date} + 60\text{ Days}$ (the baseline sector sales cycle duration).
   * **Why Chosen**: Ensures time-series analysis and pipeline forecasting tools do not silently drop open deals with missing dates.

---

### 3. ADDING THE EXECUTIVE DASHBOARD

While natural language chat is ideal for ad-hoc questioning, executive leadership (Founders, VP of Sales, VP of Operations) requires instant situational awareness without having to prompt the AI repeatedly. To solve this, we implemented an **Executive Dashboard** embedded at the top of the interface.

#### Key Dashboard Components & Rationale:
1. **Executive KPI Ribbon**: Displays high-level operational metrics at a glance, including Total Closed Bookings, Total Weighted Pipeline Value, Outstanding Accounts Receivable (AR Exposure), Cash Collected, and Active Work Order Count.
2. **Strategic Risk Radar**: Automatically scans CRM and Work Order boards to surface operational bottlenecks—flagging cash flow risks, unbilled delivery backlogs, overdue deals, and work orders missing link IDs.
3. **Sector Revenue & Attach-Rate Breakdown**: Provides interactive visual summaries of revenue distribution across industrial sectors and drone software attach rates.
4. **Instant One-Click Action Cards**: Allows executives to click pre-configured prompt cards (e.g., *"Generate Leadership Briefing"*, *"Show Overdue AR"*, *"Analyze Energy Sector"*) to instantly execute complex agentic workflows.

#### Why Adding the Dashboard Is Critical:
* **Eliminates Prompt Fatigue**: Founders do not need to type queries to see daily high-level health metrics.
* **Directs Attention to Actionable Risks**: Surfaces immediate financial hazards (e.g., unpaid AR over 90 days) visually before the executive even asks.
* **Bridges Passive & Active BI**: Combines passive visual monitoring with active AI natural language exploration in a single screen.

---

### 4. CREATING CRUD-FRIENDLY CHATS (CREATION / UPDATION / DELETION)

In real-world decision-making, executives work across distinct topics—such as Q3 Cash Flow Escalations, Energy Sector Pipeline, or KAM Performance Audits. Treating AI chat as a single ephemeral input stream severely limits productivity. We implemented full **CRUD (Create, Read, Update, Delete)** chat session management.

#### CRUD Chat Capabilities Implemented:
1. **Chat Creation (CREATE)**: Users can create new clean chat threads with a single click (*"+ New Chat"*). Each session generates a dedicated session ID, tracking query context independently.
2. **Auto & Manual Session Renaming (UPDATE)**: The system automatically names new chat sessions based on the initial executive query topic (e.g., *"AR Exposure Analysis"*). Furthermore, executives can edit and rename chat thread titles anytime to keep their sidebar workspace organized.
3. **Chat Session Deletion (DELETE)**: Executives can delete obsolete or temporary chat threads with a single click, removing associated message histories from Supabase cloud storage and local memory.
4. **Multi-Session Recall & Persistence (READ)**: Executives can switch between historical chat sessions smoothly via the sidebar. All historical messages, visual chart payloads, tabular audit logs, and data quality caveats are reloaded instantly.

#### Why CRUD Chat Capability Was Chosen:
* **Topic Organization**: Prevents context contamination across different operational inquiries.
* **Cloud & Offline Synchronization**: Chat threads sync seamlessly to Supabase PostgreSQL when online, with graceful fallback to `localStorage` when offline.
* **Multi-Device Continuity**: Founders can start an inquiry on desktop during office hours and review the exact chat history later on a mobile tablet.

---

### 5. SWITCHING BETWEEN DIFFERENT DATA VISUALIZATIONS USING 1 CLICK

A critical limitation of traditional AI tools is locked presentation: answers are rendered as plain text or a fixed chart type. However, different business decisions require different cognitive visual perspectives. We engineered an interactive **Multi-View Data Visualization** engine with instant 1-Click view toggling.

#### 1-Click Visualization Modes Supported:
1. **Bar Chart View**: Optimal for discrete categorical comparisons (e.g., comparing pipeline value across 6 sectors or comparing revenue per Key Account Manager).
2. **Area / Trend Chart View**: Ideal for time-series velocity, revenue realization curves, and cumulative quarterly pipeline growth.
3. **Donut / Share Chart View**: Best for proportional distribution analysis (e.g., sector market share percentage, deal stage distribution, software attach rate vs standalone hardware).
4. **Metric KPI Cards View**: Displays consolidated high-impact numerical figures with trend badges for quick executive scanning.
5. **Interactive Tabular Grid View**: Renders raw underlying rows with column sorting, search filtering, data caveat badges, and a 1-click *"Export to CSV"* button for financial auditing.

#### Why 1-Click Switching Is Highly Valuable:
* **Instant Visual Transformation**: Executives can convert a complex sector distribution table into a clean Donut chart or Bar chart with 1 click without re-prompting the AI model.
* **Saves Token & Latency Costs**: Eliminates the need to send follow-up prompts asking *"Now convert this table into a bar chart"*, saving LLM API tokens and eliminating wait time.
* **Empowers Auditing & Action**: An executive can view the Bar chart for high-level insight, switch to Table view to audit specific deal names, and click CSV Export to share with finance teams.

---

### 6. APP NAVIGATOR & WHY IT WILL BE VERY USEFUL

To unify executive monitoring, AI conversational inquiry, raw data inspection, and system health governance, we introduced a centralized **App Navigator** header across the application interface.

#### App Navigator Architecture & Navigation Hubs:
1. **Dashboard View Tab**: Directs executives to the visual executive command center, featuring KPI ribbons, sector revenue charts, and operational risk radars.
2. **AI Agent Chat View Tab**: Opens the intelligent natural language conversational interface with Groq `llama-3.3-70b-versatile`, structured multi-view charts, and leadership briefing generators.
3. **CRM & Board Data View Tab**: Gives executives direct visibility into normalized tabular datasets (*Deals Funnel* and *Work Order Tracker*), allowing raw data verification and manual filter controls.
4. **System Health & Governance Tab**: Displays API connection status (Monday.com GraphQL connection status, Supabase cloud sync status, Groq API ping, and local cache fallback badges).

#### Why the App Navigator Is Extremely Useful:
* **Zero Cognitive Friction**: Provides a clean, familiar navigation model for non-technical leadership without confusing page reloads or broken URL paths.
* **Complete System Transparency**: Allows executives to verify the raw data sources supporting AI answers in 1 click, building complete trust in the agent's calculations.
* **Unified Work Environment**: Merges passive dashboards, active AI dialogue, and raw tabular governance into a cohesive enterprise software suite.
