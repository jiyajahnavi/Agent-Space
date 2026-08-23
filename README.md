<div align="center">
  <img src="./AgentSpace%20Logo.jpeg" width="120" height="120" alt="AgentSpace Logo" style="border-radius: 20px;">
  
  # 🌌 AgentSpace

  **The Space for Every AI Agent**
  
  *Discover, build, deploy, and battle custom AI agents in the world's premier open marketplace and repository platform for autonomous intelligence.*

  [![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Google Gemini](https://img.shields.io/badge/Google_Gemini-API-8E44AD?style=for-the-badge&logo=google)](https://ai.google.dev/)
  [![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
</div>

---

### 📊 Project Resources

[![View PPT](https://img.shields.io/badge/View%20Project%20PPT-4285F4?style=for-the-badge&logo=google-slides&logoColor=white)](https://github.com/jiyajahnavi/Agent-Space/blob/main/AgentSpace_Challenge_640_Zuup_hackathon_oneway.pdf)
[![▶️ Project Explanation](https://img.shields.io/badge/▶️%20Project%20Explanation-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/watch?v=uH5_L9_EKuE)
[![🚀 Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-00C853?style=for-the-badge)](https://agent-space-five.vercel.app/)

## 🚀 Overview

**AgentSpace** is an advanced, developer-first AI Agent Marketplace and execution platform designed with a familiar GitHub-style interface. It enables users and developers to discover, create, share, execute, and battle autonomous AI agents seamlessly. 

Powered by **Google Gemini AI** and **Supabase**, AgentSpace provides real-time multi-turn conversation memory, code upload capabilities, dynamic agent battle arenas, and personal developer profile management.

---

## ✨ Key Features

### 🛒 1. Agent Marketplace & Explorer
* **Categorized Directory:** Explore agents across diverse domains—Coding, Business, Career, Legal, Writing, Productivity, and Analysis.
* **Filter & Search:** Instantly sort agents by Top Rated, Most Stars, or specific search keywords.
* **GitHub-Style Repository Pages:** Every agent features an interactive page complete with Live Demos, READMEs, Issues, Pull Requests, `agent.yaml` configs, and runnable SDK snippets.

### 💬 2. Intelligent Chat Agents with Multi-Turn Memory
* **8 Core Explore Agents:** Interview Coach, SQL Query Generator, Startup Idea Generator, Cover Letter Generator, Email Writer, Travel Planner, Fitness Planner, and Recipe Creator.
* **Persistent Chat History & Memory:** Chat sessions stay intact when navigating across pages or refreshing.
* **History Tab & New Chat:** Access past prompt/response histories anytime or start a fresh session with one click.
* **One-Click Code Copy:** Dedicated copy buttons for SQL queries, code snippets, and generated templates.

### ⚔️ 3. Agent Battle Mode
* **Head-to-Head Evaluation:** Pit two agents against each other using a single prompt or an uploaded PDF document.
* **Other Users Only Filter:** Opponent selection automatically filters to display only agents created by *other* users.
* **Semantic Domain Matching:** Intelligent category and keyword matching ensures agents compete against similar projects (e.g. *Resume Analyzer vs. Resume Screener*, *SQL Generator vs. DB Assistant*).

### 🛠️ 4. Code Upload & Agent Creation
* **Direct Code Upload:** Upload your custom agent Python/TypeScript code file directly when publishing new agents.
* **Auto Repo Generator:** Generate `agent.yaml`, READMEs, and configurations powered by Gemini AI.
* **GitHub Synchronization:** Sync published agents directly with your personal GitHub account.

### 👤 5. User Profile & Avatar Customization
* **Full Profile Management:** Edit your display name, username, bio, location, website, and Twitter handle.
* **Preset Avatar Picker:** Choose from 6 custom curated anime/chibi avatar presets with active state indicators and persistent session sync.

---

## 🛠️ Technology Stack

| Layer | Technology Used |
|---|---|
| **Frontend Framework** | [Next.js 15.5](https://nextjs.org/) (App Router) |
| **UI & Styling** | [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), Radix UI, Lucide Icons |
| **AI Infrastructure** | [Google Gemini API](https://ai.google.dev/) (`@google/genai`, Google Genkit) |
| **Backend & Authentication** | [Supabase](https://supabase.com/) (Auth, PostgreSQL, Session Sync) |
| **State & Storage** | React Context (`AuthProvider`, `AgentsProvider`), LocalStorage Persistence |
| **Language** | TypeScript (Strict Type Checking) |

---

## 📂 Project Structure

```
AgentSpace/
├── public/
│   └── avatars/               # Curated preset profile avatars
├── src/
│   ├── app/                   # Next.js App Router Pages
│   │   ├── agent/[id]/        # Agent details & execution page
│   │   ├── battle/            # Agent Battle Mode arena
│   │   ├── create/            # Agent creation & code upload page
│   │   ├── explore/           # Explore chat agents
│   │   ├── profile/[username]/# User profile page
│   │   └── page.tsx           # Marketplace homepage
│   ├── components/            # Reusable UI & layout components
│   │   ├── agent/             # Output displays, chat history, markdown renderers
│   │   ├── ui/                # Radix & shadcn component primitives
│   │   └── navbar.tsx         # Site navigation header
│   ├── context/               # Global state providers
│   │   ├── agents-context.tsx # Central agent registry state
│   │   └── auth-context.tsx   # Supabase authentication & user profile state
│   ├── lib/                   # Utility libraries & AI engines
│   │   ├── agents/            # Individual agent execution logic & Gemini handlers
│   │   ├── gemini.ts          # Gemini API SDK setup
│   │   ├── runAgentClient.ts  # Client-side agent runner
│   │   ├── types.ts           # TypeScript type definitions
│   │   └── data.ts            # Default mock agents database
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

* **Node.js**: `v20.0.0` or higher
* **npm** or **yarn** or **pnpm**
* **Google Gemini API Key**: Obtain a key from [Google AI Studio](https://aistudio.google.com/)

---

### Installation & Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/goblinasaddy/AgentSpace.git
   cd AgentSpace
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   # Gemini AI API Key
   GEMINI_API_KEY=your_gemini_api_key_here

   # Supabase Authentication & Database
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

5. **Access the Application:**
   Open your browser and visit [http://localhost:9002](http://localhost:9002).

---

## 🧪 Verification & Quality Assurance

Run type checking and verify build readiness:

```bash
# Type check TypeScript files
npm run typecheck

# Build production bundle
npm run build
```

---

## 🤝 Contributing

We welcome community contributions! To contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

<div align="center">
  <i>Built with ❤️ by the AgentSpace Team for the future of Autonomous AI.</i>
</div>
