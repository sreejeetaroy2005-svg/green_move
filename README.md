# 🌿 GreenMove
> The only green commute platform where every trip is blockchain-verified, WhatsApp-loggable, and redeemable for real employer rewards — no app download required.

**[🎥 Watch the 3-Minute Demo Video Here](#)**  
**[🌐 View the Live Prototype Here](#)**

---

## 🛑 The Problem
*   **74% of Bengaluru's 60 lakh daily trips** are made via private vehicles, contributing massively to urban carbon emissions.
*   **Zero Incentive to Change:** There is currently no reliable, closed-loop system to reward citizens for choosing public transit, walking, or cycling.
*   **Trust Deficit:** Employers want to offer green perks but have no way to verify if an employee actually cycled or just claimed they did.

---

## 💡 Our Solution
GreenMove solves the incentive gap by tracking, verifying, and rewarding eco-friendly commuting habits without forcing users to download yet another app. 

1.  **Commuter Logs Trip:** A user simply texts "cycled 8km today" to our WhatsApp bot.
2.  **Carbon Engine Calculation:** The backend calculates the exact CO₂ saved using IPCC & UITP India standard emission factors.
3.  **Blockchain Verification:** A cryptographic hash is generated for the trip, creating a tamper-proof record.
4.  **Reward Redemption:** The commuter earns Green Points, which can be redeemed on our dashboard for real employer-backed perks or transit discounts.

---

## ✨ Key Features (Round 2 Upgrades)
*   📱 **NLP WhatsApp Bot:** Log trips using natural language ("I took the bus for 12km"), view leaderboards, and check stats directly in WhatsApp.
*   🔗 **Blockchain-Verified Ledger:** Every trip has an immutable cryptographic hash, ensuring data integrity for CSR reporting.
*   📊 **Real-Time Dashboards:** Debounced CO2 previews, pagination, and live 30-second polling for city-wide analytics.
*   🧮 **Scientific Carbon Math:** Uses real baseline emission factors and calculates real-world equivalents (e.g. "equivalent to planting 3 trees").
*   🏆 **Gamified Streaks & Badges:** Users earn multipliers for consecutive green days, and streak resets if a day is skipped.
*   📥 **One-Click Audits:** Employers can filter by date and download verified CSV reports of all employee green commutes.
*   🛡️ **Hardened Backend:** Includes `helmet.js`, `express-rate-limit`, input validation, and a standardized `{ success: true, data: {} }` API response structure.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | HTML5, Vanilla CSS (Glassmorphism UI), Vanilla JS, Chart.js |
| **Backend** | Node.js, Express.js, node-cron |
| **Database** | PostgreSQL (Neon) / SQLite fallback for local dev |
| **Authentication** | JWT (JSON Web Tokens), Bcrypt |
| **Security** | Helmet, Express Rate Limit |
| **Bot Integration** | REST Webhooks (Designed for Twilio/WhatsApp) |

---

## 🚀 How to Run Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/sreejeetaroy2005-svg/green_move.git
    cd green_move
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment (Optional):**
    Copy `.env.example` to `.env` and set your secrets.
4.  **Seed the database with demo data (200+ historical trips):**
    ```bash
    node src/seed.js
    ```
5.  **Start the server:**
    ```bash
    npm run dev
    # or
    node src/index.js
    ```
6.  **Access the application:**
    Open [http://localhost:3000](http://localhost:3000) in your browser.  
    *(Demo Accounts: `arjun@techcorp.com`, `hr@techcorp.com`, `planner@blr.gov.in` | Password: `password123`)*

---

## 📡 API Endpoints (Quick Reference)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET`  | `/api/health` | System health check and uptime |
| `POST` | `/api/auth/login` | Authenticate and return JWT |
| `POST` | `/api/whatsapp` | NLP Webhook for WhatsApp logging |
| `POST` | `/api/trips` | Log a green trip manually |
| `POST` | `/api/trips/preview` | Real-time CO2 calculation preview |
| `GET`  | `/api/rewards/my` | Get current points, badge progress, and tx history |
| `GET`  | `/api/analytics/city` | Citywide stats (Live polling enabled) |

---

## 👥 The Team
*   **[Your Name]** – Full Stack Developer & Blockchain Integration
*   *(Add team members here)*

---

## 🙏 Acknowledgements
This project is strategically built upon and adapted from **TraceFlow**, an original hackathon-deployed blockchain waste-tracking platform. GreenMove repurposes its robust ledger, authentication, and database architecture for the green mobility domain.
