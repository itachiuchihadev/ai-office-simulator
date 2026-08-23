# AI Office Simulator — Developer & AI Copilot Instructions

## ⚠️ Critical Rule: No Git Commit / Push
> **NEVER GIT COMMIT OR PUSH**:
> Do not execute `git commit`, `git push`, or any automated git publishing commands. All git staging, committing, and pushing must be done manually by the repository owner.

---

## 🏢 Project Overview
**AI Office Simulator** is an interactive, 8-bit retro pixel art web application that visualizes multi-agent AI orchestration in real time. It simulates an AI Chief of Staff (Manager) delegating assignments to cubicle specialists (Coder, Researcher, Designer, Analyst, Writer) moving across a 2D canvas floor.

---

## 🏗️ Architecture & Project Structure

The project uses **Vite** with vanilla modern ES6 JavaScript and HTML5 Canvas (no heavy game frameworks):

```text
AI-Office-Simulator/
├── .github/
│   ├── copilot-instructions.md   # AI Copilot & Agent Instructions
│   └── INSTRUCTIONS.md           # Developer & Workflow Guidelines
├── .gitignore
├── README.md
├── index.html                    # Root entry point with layout & pixel logo
├── package.json                  # Vite configuration & metadata
├── vite.config.js                # Dev server settings (port 3000)
├── public/
│   └── assets/
│       ├── extracted_assets/all/ # 68 individual pixel sprites
│       └── *.png                 # Asset sheets
└── src/
    ├── css/
    │   └── styles.css            # Retro 8-bit design tokens & arcade dark theme
    └── js/
        ├── config.js             # Shared reactive state object
        ├── main.js               # Entry point initializing canvas, UI & events
        ├── utils.js              # Helpers (truncate, escapeHtml, etc.)
        ├── agents/
        │   ├── subagent-manager.js # Dynamic subagents store, prompts & config
        │   └── workflow.js       # Manager task evaluation & delegation engine
        ├── api/
        │   └── llm-client.js     # Unified Google Gemini & OpenAI API client
        ├── chat/
        │   ├── chat-ui.js        # RPG dialogue box message stream & avatars
        │   └── voice-input.js    # Web Speech API speech-to-text integration
        ├── office/
        │   ├── characters.js     # Movement, speech bubbles, state machine
        │   ├── navigation-grid.js # 4-directional orthogonal A* pathfinding
        │   ├── pixel-renderer.js # 2D Canvas rendering of office tiles & sprites
        │   ├── renderer.js       # High-DPI canvas loop & zoom scale manager
        │   └── rooms.js          # Coordinate mapping for desks & furniture
        └── ui/
            ├── fullscreen.js     # Fullscreen toggle helper
            ├── panel-resize.js   # Resizable split view divider
            ├── settings-modal.js # LocalStorage API key manager
            ├── team-modal.js     # Subagent & prompt customization modal
            └── theme.js          # Dark mode default & theme persistence
```

---

## 🎨 Design & Styling Guidelines

1. **Aesthetic Style**:
   - Authentic 8-bit / 16-bit arcade pixel art style.
   - Stepped pixel borders (`2px 2px 0px #04060a`), 0px border-radius, tactile click depression (`transform: translate(2px, 2px)`).
   - Enforce `image-rendering: pixelated;` on all canvases, avatars, and sprites.
2. **Typography**:
   - `Press Start 2P`: Brand titles and arcade header badges.
   - `Silkscreen`: Navigation buttons, badges, status pills, model selectors, and tab headers.
   - `Pixelify Sans`: Chat messages, modal content, inputs, and descriptions.
   - `VT323`: Terminal prompts, keyboard shortcuts, and timestamps.
3. **Theme**:
   - Default is **Dark Arcade Mode** (`data-theme="dark"`).
   - Core palette: Void Dark (`#0b0e14`, `#121824`, `#1a2234`), Neon Cyan (`#38bdf8`), Gold (`#facc15`), Emerald (`#22c55e`), Ruby (`#ef4444`).

---

## ⚙️ Development & Build Commands

- **Start Local Server**: `npm run dev` (Runs on `http://localhost:3000`)
- **Build Production Bundle**: `npm run build`
- **Preview Bundle**: `npm run preview`

---

## 🤖 Multi-Agent Orchestration Flow

1. User enters prompt via keyboard or voice in `chat-ui.js`.
2. `workflow.js` sends prompt to Manager LLM (`llm-client.js`) with dynamic orchestration prompt.
3. Manager evaluates whether to self-handle or delegate to a specialist agent.
4. Canvas animations trigger in `characters.js` via A* pathfinding (`navigation-grid.js`).
5. Specialist executes sub-task using custom system prompt from `subagent-manager.js`.
6. Manager returns synthesized answer to `chat-ui.js` with retro RPG sender badges.
