# Developer & Project Instructions

This repository contains the **AI Office Simulator** web application built with Vite, HTML5 Canvas, and Vanilla JavaScript.

## ⚠️ Critical Git Policy
> **NEVER GIT COMMIT OR PUSH CHANGES**:
> AI assistants and automated tools must **never** execute `git commit`, `git push`, or remote publish commands automatically. All git commit and push operations are handled manually by the repository owner.

---

## 📋 Key Rules & Guidelines

1. **Strict Git Rule**: Never run `git commit` or `git push` commands.
2. **Keep Code in `src/`**: All active source code lives under `src/js/` and `src/css/`.
3. **Assets in `public/`**: Static assets and pixel sprites are located in `public/assets/`.
4. **No Heavy Frameworks**: The canvas engine is implemented in pure HTML5 Canvas with custom pixel sprite rendering. Avoid adding heavy gaming libraries unless explicitly requested.
5. **Maintain Pixel Aesthetic**: Preserve the 8-bit retro theme, pixel typography (`Press Start 2P`, `Silkscreen`, `Pixelify Sans`, `VT323`), chunky borders, and arcade dark mode as default.
6. **State Management**: Shared application state is managed centrally in `src/js/config.js`.
7. **Subagent Customization**: Subagent roles, prompts, and active statuses are managed in `src/js/agents/subagent-manager.js` and stored in `localStorage`.
