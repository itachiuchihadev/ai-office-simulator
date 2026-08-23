// js/agents/subagent-manager.js — Dynamic Subagent Store, Custom Prompts & Dynamic Manager Prompt

import { state } from '../config.js';
import { getOfficeLocations } from '../office/rooms.js';

const STORAGE_KEY = 'ai_office_subagents_v4';

export const AVAILABLE_SPRITES = [
  { id: 'character_dark_hair_boy',   name: 'Dark Hair Boy',  img: '/assets/extracted_assets/all/character_dark_hair_boy.png' },
  { id: 'character_glasses_boy',     name: 'Glasses Boy',    img: '/assets/extracted_assets/all/character_glasses_boy.png' },
  { id: 'character_dark_hair_girl',  name: 'Dark Hair Girl', img: '/assets/extracted_assets/all/character_dark_hair_girl.png' },
  { id: 'character_red_hair_girl',   name: 'Red Hair Girl',  img: '/assets/extracted_assets/all/character_red_hair_girl.png' },
  { id: 'character_blue_shirt_girl', name: 'Blue Shirt Girl',img: '/assets/extracted_assets/all/character_blue_shirt_girl.png' },
  { id: 'character_designer_girl',   name: 'Pink Hair Girl', img: '/assets/extracted_assets/all/character_designer_girl.png' },
  { id: 'character_blond_boy',       name: 'Blond Boy',      img: '/assets/extracted_assets/all/character_blond_boy.png' },
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
    systemPrompt: 'You are the AI Office Manager & Chief Orchestrator. Your role is to analyze user requests, greet them, and delegate tasks to the most suitable active specialist sub-agent.'
  },
  {
    id: 'researcher',
    name: 'Researcher',
    role: 'Deep Research & Fact-Finding',
    emoji: '🔬',
    color: '#7C5CFC',
    spriteName: 'character_glasses_boy',
    deskRoom: 'researcher-desk',
    enabled: true,
    systemPrompt: 'You are the Senior Research Specialist. Your job is to perform in-depth historical, scientific, and academic fact-finding, deep research investigations, and verify data with structured source breakdowns.'
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
    systemPrompt: 'You are the Lead Software Engineer. Your job is to write clean, working, modern code, debug issues, write algorithms, and explain technical software solutions clearly.'
  },
  {
    id: 'writer',
    name: 'Writer',
    role: 'Articles, News & Content Creator',
    emoji: '✍️',
    color: '#F59E0B',
    spriteName: 'character_red_hair_girl',
    deskRoom: 'writer-desk',
    enabled: true,
    systemPrompt: 'You are the Chief Content & News Specialist. Your job is to write engaging news articles, press digests, editorials, blog posts, essays, documentation, and well-crafted written publications.'
  },
  {
    id: 'analyst',
    name: 'Analyst',
    role: 'Data & Financial Analyst',
    emoji: '📊',
    color: '#EF4444',
    spriteName: 'character_blue_shirt_girl',
    deskRoom: 'analyst-desk',
    enabled: true,
    systemPrompt: 'You are the Data & Analytics Lead. Your job is to analyze quantitative metrics, financial data, quarterly trends, business statistics, and present strategic recommendations.'
  },
  {
    id: 'designer',
    name: 'Designer',
    role: 'UI/UX & Visual Design',
    emoji: '🎨',
    color: '#EC4899',
    spriteName: 'character_designer_girl',
    deskRoom: 'designer-desk',
    enabled: true,
    systemPrompt: 'You are the UI/UX Design Director. Your job is to create visual design guidelines, UX wireframes, color palettes, and component design specifications.'
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
  list.filter(a => a.enabled !== false).forEach((agent, index) => {
    const home = locs.CHARACTER_HOMES[agent.id] || { x: 128, y: 148 };
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
      // Update metadata dynamically
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

/**
 * Dynamically builds the Manager Orchestration Prompt from whatever subagents
 * are currently active and configured by the user. Contains NO hardcoded assumptions.
 */
export function buildDynamicManagerPrompt() {
  const activeSpecialists = getActiveSubagents().filter(a => !a.isManager);

  const teamDescriptions = activeSpecialists.map((a, idx) => 
    `${idx + 1}. Agent ID: "${a.id}" | Name: ${a.name} (${a.role})\n   Capabilities & Focus: ${a.systemPrompt || a.role}`
  ).join('\n\n');

  const validAgentIds = activeSpecialists.map(a => `"${a.id}"`).join(' | ') || '"none"';

  return `You are the AI Office Manager & Chief Orchestrator.
Your job is to receive the user request and dynamically delegate it to the single best specialist sub-agent from your active team.

CURRENT CONFIGURED SPECIALIST SUB-AGENTS:
${teamDescriptions || '(No specialists are currently enabled. You must handle the request directly.)'}

DELEGATION RULES:
1. GREETINGS & SIMPLE PLEASANTRIES:
   - If the user prompt is strictly a simple greeting (e.g. "hi", "hello", "good morning", "who are you"), set "canSelfHandle": true and answer in "directResponse".

2. TASK DELEGATION:
   - For all actual work and inquiries (questions, analysis, code, news, articles, design, research, calculations, advice, etc.), you MUST set "canSelfHandle": false.
   - Choose the single most appropriate specialist from the CURRENT CONFIGURED SPECIALIST SUB-AGENTS list above based strictly on their Role and Capabilities.
   - Set "delegation.agentId" to the exact matching Agent ID: ${validAgentIds}.
   - Set "delegation.subTask" to clear instructions for that specialist.

OUTPUT FORMAT:
Return ONLY valid JSON matching this exact structure:
{
  "canSelfHandle": boolean,
  "reasoning": "brief explanation of why this subagent was chosen",
  "directResponse": "string (only if canSelfHandle is true)",
  "delegation": {
    "agentId": ${validAgentIds},
    "subTask": "string describing task assigned to the specialist"
  }
}`;
}
