# EUC Young Adults — Church Management System

A dynamic web platform for Emmanuel United Church (EUC) of Maryland Young Adult Ministry. Built to manage discipleship, DNA Pod groups, prayer requests, and church growth.

![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-3.1-green.svg)
![Vue.js](https://img.shields.io/badge/Vue.js-3-brightgreen.svg)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-CDN-06B6D4.svg)

## Features

| Module | Description |
|--------|-------------|
| 🌐 **Public Website** | Apple-style glassmorphism landing page with live member counters, Daily Manna Bible verse, and contact form |
| 📊 **Dashboard** | Real-time admin CRM with growth charts, member metrics, and spiritual stage tracking |
| 👥 **Members** | Full member directory with roles (Admin/Leader/Member) and spiritual journey stages |
| 🧬 **DNA Pods** | Manage micro-groups of 3-5 members for deep discipleship and leadership incubation |
| 📋 **Pipeline** | Kanban board to track newcomer integration (First Contact → Welcomed → Invited → Integrated) |
| 📅 **Weekly Planner** | Leader blueprints with Bible passage, discussion questions, and post-meeting feedback |
| 🙏 **Prayer Wall** | Submit prayer requests, support with "I'm Praying" button, and celebrate answered prayers |
| 🏆 **Spiritual Journey** | Visual milestone tracker (New → Saved → Baptized → Foundations → Ready to Lead → Leading) |
| 📚 **Resource Library** | Digital library for Bible studies, leadership training, and devotional materials |

## Quick Start

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/euc-ya-management.git
cd euc-ya-management

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install Flask

# Run the application
python3 app.py
```

Open your browser:
- **Public Website:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3000/dashboard

## Tech Stack

- **Backend:** Python / Flask
- **Database:** SQLite (easily migrated to PostgreSQL)
- **Frontend:** Vue.js 3, Tailwind CSS, Chart.js
- **Bible API:** bible-api.com (free, no API key needed)
- **Design:** Apple-inspired glassmorphism UI

## Project Structure

```
euc-ya-management/
├── app.py                    # Flask backend (API + routes)
├── requirements.txt          # Python dependencies
├── .gitignore
├── README.md
└── templates/
    ├── landing.html          # Public website (glassmorphism)
    └── dashboard.html        # Admin dashboard SPA
```

## License

MIT — Built with ❤️ for the Kingdom.
