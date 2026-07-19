# 📊 e-Office Pro (Insight360)

> **Next-Generation GovTech Performance Analytics & AI-Assisted Collaborative Redistribution System**

e-Office Pro (Insight360) is a real-time, intelligence-driven performance monitoring and wellness-protection ecosystem designed to overlay standard government e-Office software. Rather than just tracking files, e-Office Pro introduces role-based workspaces, data-backed benchmarks, explainable AI risk engines, and a tamper-evident cryptographic audit vault.

### 🌐 Live Platform Link
Deploy active on Render: **[https://eoffice-pro.onrender.com](https://eoffice-pro.onrender.com)**

[![Platform Status](https://img.shields.io/badge/Platform-Live-success?style=for-the-badge&logo=render&logoColor=white)](https://eoffice-pro.onrender.com)
[![Framework](https://img.shields.io/badge/Next.js-14-blue?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/Prisma-SQLite-f1f5f9?style=for-the-badge&logo=prisma&logoColor=123a8a)](https://www.prisma.io/)

---

## 🚀 Key Feature Upgrades (Session 4)

### 🤝 AI-Assisted Collaborative Workload Redistribution System
Instead of automatic background file reassignments, e-Office Pro implements a collaborative team-based workflow:
1.  **AI Redirection Queue**: When an officer is overloaded, the system computes compatible department candidates, ranks them using their turnaround metrics, and creates a sequential queue.
2.  **Interactive Requests**: Peer candidates receive real-time, interactive alerts in their **Notification Center** and **Workspace** showing predicted effort, deadlines, and digital twin impact forecasts.
3.  **Collaborative Accept**: Candidates can **Accept** the files (earning badge points and incrementing their `helpingScore`) or **Decline** (inputting constraint reasons, which automatically triggers sequential escalation to the next peer in the queue).
4.  **Policy-Based Fallback**: If the queue is exhausted, the engine automatically assigns files based on departmental backlog safety guidelines and logs the fallback transaction.

### 🏆 Government Performance League Table (Benchmark Center)
Upgraded the **Benchmark Center** into an executive performance index console:
*   **3D/2D Highlight Metrics**: Instantly reports the Best Performing Department, Lowest Backlog Region, Fastest File Resolver, and standard compliance rate (DPI $\ge 70\%$).
*   **Performance Telemetry Tabs**: Integrates Composed Productivity Charts, Resolution Speed Leaders, and Regional Backlog Heatmaps.
*   **Help Score Rankings**: Features the **Helping Leaders** table tracking officers' collaborative contributions and awarding badges (`🥇 Support Champion`, `🥈 Collaborative Officer`, `🥉 Workload Hero`).

---

## 🏢 Persona-Based Workspaces

*   **Secretary / Executive Dashboard**: High-level organizational oversight. Monitors the Departmental Productivity Index ($DPI$), tracks departments at risk, views citizen satisfaction scores, and reviews the **AI Redistribution Monitor** to audit queue redirections.
*   **Team Leader Workspace**: Visualizes team bandwidth, handles file forward/reject actions, reviews burnout shields, and monitors goal progression across their department.
*   **Officer Workspace**: A clean, execution-focused hub. Officers update task progress, sign and forward files, manage incoming/outgoing workload assistance requests, and track personal DPI trends.

---

## 🛠️ The Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14 (App Router)** | Modern React framework with server-side rendering |
| **Styling** | **Tailwind CSS & Lucide Icons** | Premium government-portal aesthetic & responsive design |
| **Database ORM** | **Prisma ORM** | Schema management and type-safe database queries |
| **Database** | **SQLite** | Fast local database compatible with serverless ephemeral hosting |
| **Data Visualization** | **Recharts** | Fully responsive dashboard charts & data trends |
| **UI Enhancements** | **Canvas Confetti & Next Themes** | Micro-interactions, achievements, and dark/light mode |

---

## 🧬 Core Formulas

### 1. Departmental / Individual Productivity Score ($DPI$)
$$Productivity = (w_1 \cdot \text{CompletionRate}) + (w_2 \cdot \text{Timeliness}) + (w_3 \cdot \text{Quality}) + (w_4 \cdot \text{Attendance}) + (w_5 \cdot \text{Collaboration}) - (w_6 \cdot \text{DelayPenalty})$$

### 2. Explainable Delay Risk Score
$$DelayRisk = 0.35 \cdot \left(\frac{\text{FileAge}}{\text{SLA\_Category\_Days}}\right) + 0.20 \cdot \left(\frac{\text{HolderBacklog}}{\text{Dept\_Avg\_Backlog}}\right) + 0.20 \cdot (\text{OnLeaveFlag}) + 0.15 \cdot (\text{ReworkCount}) + 0.10 \cdot (\text{PriorityWeight})$$

---

## 🏁 Getting Started (Local Run)

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/LoopTroop1/Insight360.git
    cd Insight360
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Database & Seed Data**:
    ```bash
    npx prisma db push
    node prisma/seed.js
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

5.  **Open in Browser**:
    Navigate to [http://localhost:3000](http://localhost:3000) to view.

---

## ☁️ Deploying to Render (Free Tier)
This repository includes a [render.yaml](file:///d:/makethon%204.0/render.yaml) blueprint file. To deploy:
1.  Go to the **Render Dashboard** > **Blueprints** > **New Blueprint Instance**.
2.  Connect your repository (`LoopTroop1/Insight360`).
3.  Add your SMTP secrets (`SMTP_USER`, `SMTP_PASS`) when prompted.
4.  Render will automatically build and launch the platform using Node.js and SQLite.