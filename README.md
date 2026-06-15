# 🌿 GreenMove

> The only green commute platform where every trip is blockchain-verified, WhatsApp-loggable, and redeemable for real employer rewards — no app download required.

**🎥 Demo Video:** https://drive.google.com/drive/folders/1aZ0Jl0gRj4wyxlbdtUnU83w-wFtx6hGS

**🌐 Live Demo:** https://green-move.vercel.app/

---

## 🛑 The Problem

* **74% of Bengaluru's daily trips** are made using private vehicles, contributing significantly to urban carbon emissions.
* **No Reliable Incentive System:** Citizens receive little to no reward for choosing sustainable transportation.
* **Verification Challenge:** Employers and organizations cannot reliably verify claimed green commutes, making reward programs difficult to implement.

---

## 💡 Our Solution

GreenMove bridges the gap between sustainable commuting and meaningful rewards through a simple, verifiable platform.

### How It Works

1. **Log a Trip**

   * Users send a message such as *"cycled 8km today"* to the WhatsApp bot.

2. **Carbon Savings Calculated**

   * The system computes CO₂ savings using recognized emission factors.

3. **Blockchain Verification**

   * Each trip receives a cryptographic hash and is stored in an immutable ledger.

4. **Earn Rewards**

   * Users accumulate Green Points redeemable for employer-sponsored incentives and benefits.

---

## ✨ Key Features

* 📱 **WhatsApp-Based Logging** – No app installation required.
* 🤖 **Natural Language Processing** – Understands messages like *"I took the bus for 12km"*.
* 🔗 **Blockchain-Verified Records** – Tamper-proof commute verification.
* 📊 **Live Analytics Dashboard** – Real-time sustainability insights.
* 🧮 **Scientific Carbon Calculations** – Based on recognized emission standards.
* 🏆 **Gamification System** – Streaks, badges, and reward multipliers.
* 📥 **Employer Audit Reports** – Download verified sustainability reports.
* 🛡️ **Secure Backend** – JWT authentication, Helmet, rate limiting, and input validation.
* ⚡ **No App Download Required** – Accessible directly through WhatsApp.

---

## 🛠️ Tech Stack

| Component      | Technology                        |
| -------------- | --------------------------------- |
| Frontend       | HTML5, CSS3, JavaScript, Chart.js |
| Backend        | Node.js, Express.js               |
| Database       | PostgreSQL (Neon), SQLite         |
| Authentication | JWT, Bcrypt                       |
| Security       | Helmet, Express Rate Limit        |
| Automation     | node-cron                         |
| Integration    | WhatsApp Webhooks                 |

---

## 🚀 How to Run Locally

### Clone the Repository

```bash
git clone https://github.com/sreejeetaroy2005-svg/green_move.git
cd green_move
```

### Install Dependencies

```bash
npm install
```

### Configure Environment (Optional)

Create a `.env` file and configure any required secrets.

### Seed Demo Data

```bash
node src/seed.js
```

### Start the Server

```bash
npm run dev

# or

node src/index.js
```

### Access the Application

Open:

```text
http://localhost:3000
```

### Demo Accounts

| Role         | Email                                           |
| ------------ | ----------------------------------------------- |
| Employee     | [arjun@techcorp.com](mailto:arjun@techcorp.com) |
| HR Manager   | [hr@techcorp.com](mailto:hr@techcorp.com)       |
| City Planner | [planner@blr.gov.in](mailto:planner@blr.gov.in) |

Password for all accounts:

```text
password123
```

---

## 📡 API Endpoints

| Method | Endpoint              | Description                                 |
| ------ | --------------------- | ------------------------------------------- |
| GET    | `/api/health`         | System health check                         |
| POST   | `/api/auth/login`     | Authenticate and return JWT                 |
| POST   | `/api/whatsapp`       | NLP Webhook for WhatsApp logging            |
| POST   | `/api/trips`          | Log a green trip                            |
| POST   | `/api/trips/preview`  | Real-time CO₂ calculation preview           |
| GET    | `/api/rewards/my`     | Get points, badges, and transaction history |
| GET    | `/api/analytics/city` | Citywide analytics and statistics           |

---

## 🌱 Impact

GreenMove encourages sustainable commuting by making every eco-friendly trip measurable, verifiable, and rewarding.

Through WhatsApp accessibility, blockchain-backed verification, and real-world incentives, GreenMove helps citizens, employers, and cities collaborate toward reducing carbon emissions and promoting greener urban mobility.

### Key Benefits

* 🚲 Encourages cycling, walking, and public transit usage
* 🌍 Reduces transportation-related carbon emissions
* 🏢 Enables employers to run verified sustainability programs
* 📊 Provides transparent and auditable environmental impact data
* 🏆 Rewards positive commuter behavior through gamification

---

## 🔮 Future Enhancements

* AI-powered commute recommendations
* Direct integration with metro and bus ticketing systems
* Corporate sustainability leaderboards
* Carbon credit marketplace integration
* Mobile app companion experience
* Multi-city deployment across India

---

### 🌐 Project Links

**Live Application:** https://green-move.vercel.app/

**Demo Video:** https://drive.google.com/drive/folders/1aZ0Jl0gRj4wyxlbdtUnU83w-wFtx6hGS

**GitHub Repository:** https://github.com/sreejeetaroy2005-svg/green_move
