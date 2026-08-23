// js/agents/subagent-manager.js — Dynamic Subagent Configuration, Prompts & Persistence

import { state } from '../config.js';
import { getOfficeLocations } from '../office/rooms.js';

const STORAGE_KEY = 'ai_office_subagents_v3';

export const AVAILABLE_SPRITES = [
  { id: 'character_dark_hair_boy',    name: 'Dark Hair Boy', img: '/assets/extracted_assets/all/character_dark_hair_boy.png' },
  { id: 'character_glasses_boy',      name: 'Glasses Boy',   img: '/assets/extracted_assets/all/character_glasses_boy.png' },
  { id: 'character_dark_hair_girl',   name: 'Dark Hair Girl',img: '/assets/extracted_assets/all/character_dark_hair_girl.png' },
  { id: 'character_red_hair_girl',    name: 'Red Hair Boy',  img: '/assets/extracted_assets/all/character_red_hair_girl.png' },
  { id: 'character_blue_shirt_girl',  name: 'Blue Shirt Girl',img: '/assets/extracted_assets/all/character_blue_shirt_girl.png' },
  { id: 'character_designer_girl',    name: 'Pink Hair Girl',img: '/assets/extracted_assets/all/character_designer_girl.png' },
  { id: 'character_blond_boy',        name: 'Blond Boy',     img: '/assets/extracted_assets/all/character_blond_boy.png' },
];

export const DEFAULT_SUBAGENTS = [
  {
    id: 'manager',
    name: 'Manager',
    role: 'Orchestrator & Chief of Staff',
    emoji: '🧑‍💼',
    color: '#4F6EF7',
    spriteName: 'character_dark_hair_boy',
    deskRoom: 'manager-desk',
    enabled: true,
    isManager: true,
    systemPrompt: `You are the AI Office Manager & Chief Orchestrator. Your role is to analyze user requests, greet them, and delegate tasks to the most suitable active specialist sub-agent.`
  },
  {
    id: 'researcher',
    name: 'Researcher',
    role: 'Data & Search Specialist',
    emoji: '🔬',
    color: '#7C5CFC',
    spriteName: 'character_glasses_boy',
    deskRoom: 'researcher-desk',
    enabled: true,
    systemPrompt: `You are the Senior Research Specialist. Your job is to perform in-depth analysis, gather relevant facts, and provide structured insights with high accuracy.`
  },
  {
    id: 'coder',
    name: 'Coder',
    role: 'Software Engineer & Architect',
    emoji: '👨‍💻',
    color: '#22C55E',
    spriteName: 'character_dark_hair_girl',
    deskRoom: 'coder-desk',
    enabled: true,
    systemPrompt: `You are the Lead Software Engineer. Your job is to write clean, working, modern code, debug issues, and explain technical solutions clearly.`
  },
  {
    id: 'writer',
    name: 'Writer',
    role: 'Content & Technical Docs',
    emoji: '✍️',
    color: '#F59E0B',
    spriteName: 'character_red_hair_girl',
    deskRoom: 'writer-desk',
    enabled: true,
    systemPrompt: `You are the Chief Content Specialist. Your job is to draft engaging, well-structured articles, guides, summaries, and documentation.`
  },
  {
    id: 'analyst',
    name: 'Analyst',
    role: 'Data & Strategy Analyst',
    emoji: '📊',
    color: '#EF4444',
    spriteName: 'character_blue_shirt_girl',
    deskRoom: 'analyst-desk',
    enabled: true,
    systemPrompt: `You are the Data & Analytics Lead. Your job is to analyze metrics, evaluate trade-offs, compare options, and present strategic recommendations.`
  },
  {
    id: 'designer',
    name: 'Designer',
    role: 'UI/UX & Product Design',
    emoji: '🎨',
    color: '#EC4899',
    spriteName: 'character_designer_girl',
    deskRoom: 'designer-desk',
    enabled: true,
    systemPrompt: `You are the UI/UX Design Director. Your job is to create visual design guidelines, UX wireframes, and design token recommendations.`
  }
];

// Load subagents from localStorage or initialize defaults
export function loadSubagents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load subagents from storage:', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_SUBAGENTS));
}

export function saveSubagents(agentsList) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agentsList));
  } catch (e) {
    console.warn('Failed to save subagents:', e);
  }
  applyActiveSubagentsToState(agentsList);
}

// Get only enabled subagents
export function getActiveSubagents() {
  const all = loadSubagents();
  return all.filter(a => a.enabled !== false);
}

// Synchronize state.characters with active subagents
export function applyActiveSubagentsToState(agentsList = null) {
  const list = agentsList || loadSubagents();
  const locs = getOfficeLocations();

  // Clear existing non-matching characters
  const activeIds = new Set(list.filter(a => a.enabled !== false).map(a => a.id));

  // Remove disabled characters from state
  Object.keys(state.characters).forEach(id => {
    if (!activeIds.has(id)) {
      delete state.characters[id];
    }
  });

  // Add/update active characters
  list.filter(a => a.enabled !== false).forEach(agent => {
    const home = locs.CHARACTER_HOMES[agent.id] || { x: 128, y: 114 };
    if (!state.characters[agent.id]) {
      state.characters[agent.id] = {
        ...agent,
        x: home.x,
        y: home.y,
        targetX: home.x,
        targetY: home.y,
        state: 'idle',
        bobOffset: Math.random() * Math.PI * 2,
        path: [],
        pathIndex: 0,
        speed: 0.9,
        facing: 'down',
      };
    } else {
      // Update metadata (name, role, sprite, prompt, color)
      Object.assign(state.characters[agent.id], {
        name: agent.name,
        role: agent.role,
        emoji: agent.emoji,
        color: agent.color,
        spriteName: agent.spriteName,
        systemPrompt: agent.systemPrompt,
      });
    }
  });
}

// Dynamically generate Manager LLM Orchestration Prompt based on configured subagents
export function buildDynamicManagerPrompt() {
  const activeSpecialists = getActiveSubagents().filter(a => !a.isManager);

  const teamDescriptions = activeSpecialists.map(a => 
    `- "${a.id}": ${a.emoji} **${a.name}** (${a.role}) -> Best suited for: ${a.systemPrompt}`
  ).join('\n');

  const validAgentIds = activeSpecialists.map(a => `"${a.id}"`).join(' | ');

  return `You are the AI Office Manager & Chief Orchestrator.
Your role is to evaluate the user prompt and delegate work to the appropriate active specialist sub-agent.

CURRENT ACTIVE SPECIALIST TEAM MEMBERS:
${teamDescriptions || '- No specialist agents currently enabled. Handle directly.'}

RULES:
1. "canSelfHandle" MUST BE true ONLY IF the user input is a pure greeting or pleasantry (e.g. "hi", "hello", "who are you"), OR if no specialists are currently available.
   - For pure greetings, set "canSelfHandle": true and provide a warm greeting in "directResponse".

2. FOR ALL OTHER TASKS:
   - You MUST set "canSelfHandle": false.
   - You MUST delegate to the most suitable active specialist sub-agent (${validAgentIds || '"none"'}).
   - Formulate a clear, specific "subTask" explaining what the specialist must do.

OUTPUT FORMAT:
Return ONLY valid JSON strictly adhering to this structure:
{
  "canSelfHandle": boolean,
  "reasoning": "string explaining why this subagent was chosen",
  "directResponse": "string (only if canSelfHandle is true)",
  "delegation": {
    "agentId": ${validAgentIds || '"none"'},
    "subTask": "string describing task assigned to specialist"
  }
}`;
}
