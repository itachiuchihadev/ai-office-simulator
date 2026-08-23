# 🏢 AI Office Simulator — 8-Bit Multi-Agent Orchestrator

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/)
[![Style](https://img.shields.io/badge/Style-Retro%20Pixel%20Art-38BDF8)](https://fonts.google.com/specimen/Press+Start+2P)
[![Theme](https://img.shields.io/badge/Theme-Arcade%20Dark%20Mode-0F172A)](https://github.com/)

> **An interactive 8-bit / 16-bit retro pixel art simulator that visualizes autonomous multi-agent AI orchestration in real time.** Watch your AI Manager evaluate tasks, delegate assignments, and dispatch specialized subagents across office cubicles, archives, and meeting desks.

---

## 🌟 Features

- 👾 **Live 8-Bit Pixel Office Canvas**: Real-time 2D animated pixel environment with walking agents, idle animations, desks, water coolers, coffee mugs, and dynamic speech bubbles.
- 🧑‍💼 **Manager & Specialist Workflow**: The AI Manager receives your user prompts, evaluates task complexity, and either solves it directly or delegates to the right cubicle specialist (Coder, Researcher, Designer, Analyst, Writer).
- 💬 **Retro RPG Dialogue Chat Interface**: Interactive quest/briefing chat terminal featuring pixel typography (`Press Start 2P`, `Silkscreen`, `Pixelify Sans`), agent name tags, voice input, and bouncing square typing indicators.
- ⚙️ **Subagent Team Management**: Configure agent designations, assign custom system prompts, select individual pixel avatars, and toggle active cubicles in an authentic 16-bit RPG system window.
- 🔑 **Multi-LLM Provider Support**: Connect your own Google Gemini, OpenAI, or Anthropic API keys, or run in built-in **Demo Simulation Mode** without keys.
- 🌙 **Cyberpunk Dark Theme Default**: Crisp high-contrast arcade aesthetic with neon cyan and gold accents, stepped 3D pixel borders, and light mode toggle.
- 🔍 **Interactive Controls**: Resizable split panels, canvas zoom controls (`+`, `-`, `RESET`), and fullscreen mode.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Installation
```bash
# Clone repository
git clone https://github.com/itachiuchihadev/ai-office-simulator.git

# Navigate to project folder
cd AI-Office-Simulator

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser to start orchestrating your pixel AI team!

---

## 🛠️ Tech Stack

- **Frontend**: HTML5 Canvas, Vanilla CSS3 (Custom 8-bit Design Tokens), Modern ES Modules
- **Bundler / Dev Server**: [Vite](https://vitejs.dev/)
- **Typography**: Google Fonts (`Press Start 2P`, `Silkscreen`, `Pixelify Sans`, `VT323`)
- **LLM Integrations**: Google Gemini API, OpenAI GPT-4o / GPT-4o-mini, Anthropic Claude

---

## 🎮 How It Works

1. **User Transmits Task**: Type or dictate a prompt into the retro terminal prompt.
2. **Manager Evaluation**: The Manager agent in the corner office evaluates requirements.
3. **Agent Delegation & Movement**: The Manager walks over to the target specialist, hands over the prompt, and the specialist moves to reference archives or their desk to execute.
4. **Result Synthesis**: The specialist delivers findings back to the Manager, who outputs the final response into the RPG dialog stream.

---

## 📜 License

MIT License. Free for personal and commercial exploration.
