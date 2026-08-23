# 🛒 Voice Command Shopping Assistant (ListEase)

> A production-grade MERN-stack voice shopping list manager with smart recommendations, multi-parameter catalog search, and hybrid AI/regex natural language understanding.

🌐 **Live Demo**: [https://voice-command-shopping-assistant-woad.vercel.app/](https://voice-command-shopping-assistant-woad.vercel.app/)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-success?style=flat-square&logo=vercel)](https://voice-command-shopping-assistant-woad.vercel.app/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Groq AI](https://img.shields.io/badge/Groq%20AI-LLaMA--3-F55036?logo=groq&logoColor=white)](https://groq.com)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-Animations-0055FF?logo=framer&logoColor=white)](https://framer.com/motion)
[![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)

---

## ✨ Feature Checklist & Verification

### 1. Voice Input
- ✅ **Voice Command Recognition**: Browser-native Web Speech API (`webkitSpeechRecognition`) for zero-cost, zero-latency speech recognition (`Frontend/src/hooks/useSpeechRecognition.js`).
- ✅ **Natural Language Processing (NLP)**: Hybrid architecture featuring Groq Cloud LLaMA-3 AI endpoint (`POST /api/nlp/parse`) with instant fallback to a local rule-based regex parser (`Frontend/src/utils/intentParser.js`).
- ✅ **Multilingual & Hinglish Support**: Dual language support (`en-IN` English & `hi-IN` Hindi/Hinglish) with catalog alias normalization (e.g., *"doodh"* ➔ *"milk"*, *"tamatar"* ➔ *"tomato"*).

### 2. Smart Suggestions
- ✅ **Product Recommendations (Running Low)**: Detects frequent purchases ($\ge 3$ buys) not currently on the list via MongoDB `PurchaseHistory` model.
- ✅ **Seasonal Recommendations**: Dynamically flags produce and items in season (`Item.inSeason: true`).
- ✅ **Substitutes & Alternatives**: Recommends healthier or in-stock replacements (e.g., almond milk for dairy milk).
- ✅ **Popular Essentials**: Starter recommendations for new users with zero history.

### 3. Shopping List Management
- ✅ **Voice-Driven Add/Remove/Update**: Speak commands like *"Add 2 kg apples"* or *"Remove milk from list"*.
- ✅ **Auto-Categorization**: Automatic categorization into `dairy`, `produce`, `snacks`, `beverages`, `grains`, `pulses`, `meat`, `household`, `spices`, and `condiments`.
- ✅ **Quantity & Unit Management**: Intelligently extracts amounts and units (`2 bottles`, `500 g`, `1 dozen`, `3 kg`).
- ✅ **Bento Grid UI & Reordering**: Interactive checklist, inline quantity steppers, category filter pills, and Framer Motion layout animations.

### 4. Voice-Activated Search & Multi-Filter Drawer
- ✅ **Voice Catalog Search**: Speak *"Find organic apples"* or *"Search dairy items"*.
- ✅ **Multi-Parameter Filtering**: Filter by Price ceiling (under ₹X), Minimum price, Brand / quality qualifier, and Category.
- ✅ **Quick-Add**: Direct one-click addition from search results into the active list.

### 5. UI/UX Excellence
- ✅ **Lucide React Icons**: Clean, modern iconography throughout the app.
- ✅ **Framer Motion Fluid Animations**: Smooth route transitions, staggered card entrances, spring-bounced toast notifications, and reordering.
- ✅ **Real-Time Visual Feedback**: Live interim speech card, glowing WebGL wave visualizer, and `ConfirmChip` ambiguity resolution.
- ✅ **Mobile-First Responsive Layout**: Bottom navigation bar and desktop floating `BubbleMenu`.

---

## 🏗️ Architecture & Tech Stack

```
Frontend (React 18 + Vite + React Router + Framer Motion)
  │
  ├── Web Speech API (Client-side audio recognition)
  │
  └── REST API Client (Fetch with unified error handling)
        │
Backend (Node.js + Express 4)
  │
  ├── /api/nlp/parse     ───> Groq Cloud AI (LLaMA-3 structured intent parsing)
  ├── /api/list          ───> MongoDB (Active shopping list items & categories)
  ├── /api/search        ───> MongoDB (Multi-parameter catalog search & regex safety)
  ├── /api/suggestions   ───> MongoDB (Purchase history & seasonal recommendation engine)
  └── /health            ───> Server uptime & MongoDB connection status
```

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Arpit2singh/Unthinkable-assignment-Voice-Command.git
cd Unthinkable-assignment-Voice-Command
```

### 2. Configure Environment Variables
- In `Backend/.env`:
  ```env
  MONGO_URI=your_mongodb_atlas_connection_string
  PORT=5000
  NODE_ENV=development
  ALLOWED_ORIGINS=http://localhost:5173
  GROQ_API_KEY=your_groq_api_key
  ```
- In `Frontend/.env`:
  ```env
  VITE_API_URL=http://localhost:5000
  VITE_DEFAULT_LANG=en-IN
  ```

### 3. Run Backend
```bash
cd Backend
npm install
npm run dev
```

### 4. Run Frontend
```bash
cd Frontend
npm install
npm run dev
```

---

## 📝 Approach Write-up (Technical Summary — < 200 words)

> **ListEase** is built using a resilient, edge-case-first MERN architecture with hybrid natural language processing. For voice input, we leverage the browser-native **Web Speech API** for zero-latency, zero-cost streaming speech-to-text without heavy audio transfers. Spoken transcripts are processed through a **Hybrid NLP Engine**: requests are analyzed by **Groq Cloud's LLaMA-3 LLM** for semantic intent and entity extraction (supporting English, Hindi, and Hinglish), with an instant, silent fallback to a local rule-based regex parser ensuring 100% offline availability.
> 
> The **Smart Suggestions Engine** combines frequency-based historical purchase analysis (`PurchaseHistory` collection) to proactively alert users when they are "Running Low" on staples, paired with real-time seasonal filtering and product substitution mappings. 
> 
> The frontend is crafted in **React 18** with **React Router**, styled in a dark-mode "Deep Obsidian" aesthetic, and animated using **Framer Motion** for layout-driven reordering, route transitions, and live feedback indicators (`ConfirmChip` for ambiguity). Data integrity is backed by indexed MongoDB schemas with ReDoS-safe search queries.

---

## 📄 License
MIT License
