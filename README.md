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

## ✨ Key Features
*   📱 **WhatsApp-Native Logging:** Zero friction. Log trips and check balances entirely via WhatsApp text.
*   🔗 **Blockchain-Verified Ledger:** Every trip has an immutable cryptographic hash, ensuring data integrity for CSR reporting.
*   📊 **Multi-Stakeholder Dashboards:** Dedicated, role-based views for Commuters, Employers, and City Planners.
*   🧮 **Scientific Carbon Math:** Uses real baseline emission factors (Private Car: ~192g CO₂/km vs. City Bus: ~89g CO₂/km).
*   🏆 **Gamified Streaks & Badges:** Users earn multipliers for consecutive green days and unlock badges like *Cycle Hero* and *Carbon Saver*.
*   📥 **One-Click Audits:** Employers can instantly download verified CSV reports of all employee green commutes.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | HTML5, Vanilla CSS (Glassmorphism UI), Vanilla JS, Chart.js |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite3 (Adaptable to PostgreSQL) |
| **Authentication** | JWT (JSON Web Tokens), Bcrypt |
| **Ledger / Crypto** | Node `crypto` module (SHA-256 Hashing) |
| **Bot Integration** | REST Webhooks (Designed for Twilio/WhatsApp Business API) |

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
3.  **Seed the database with demo data:**
    ```bash
    node src/seed.js
    ```
4.  **Start the server:**
    ```bash
    npm run dev
    # or
    node src/index.js
    ```
5.  **Access the application:**
    Open [http://localhost:3000](http://localhost:3000) in your browser.  
    *(Demo Accounts: `arjun@techcorp.com`, `hr@techcorp.com`, `planner@blr.gov.in` | Password: `password123`)*

---

## 📡 API Endpoints (Quick Reference)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate and return JWT |
| `POST` | `/api/whatsapp` | Webhook for processing WhatsApp commute texts |
| `POST` | `/api/trips` | Log a green trip manually (Dashboard) |
| `GET`  | `/api/trips/leaderboard` | Get top 5 commuters by CO₂ saved |
| `GET`  | `/api/rewards/my` | Get current points and badge status |
| `GET`  | `/api/analytics/city` | Citywide stats: CO₂, active users, modal share |

---

## 👥 The Team
*   **[Your Name]** – Full Stack Developer & Blockchain Integration
*   *(Add team members here)*

---

## 🙏 Acknowledgements
This project is strategically built upon and adapted from **TraceFlow**, an original hackathon-deployed blockchain waste-tracking platform. GreenMove repurposes its robust ledger, authentication, and database architecture for the green mobility domain.
