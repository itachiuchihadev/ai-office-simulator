// js/agents/workflow.js — Manager Orchestration & Dynamic Sub-Agent Workflow Coordinator

import { state } from '../config.js';
import { truncate } from '../utils.js';
import { getOfficeLocations } from '../office/rooms.js';
import { getActiveSubagents, buildDynamicManagerPrompt } from './subagent-manager.js';
import { moveCharacterTo, moveCharacterHome, showSpeechBubble } from '../office/characters.js';
import { addChatMessage } from '../chat/chat-ui.js';
import { LLMClient } from '../api/llm-client.js';
import { getStoredApiKeys } from '../ui/settings-modal.js';

export async function runWorkflow(userMessage) {
  if (state.demoRunning) return;
  state.demoRunning = true;

  const modelSelector = document.getElementById('modelSelector');
  const selectedModel = modelSelector ? modelSelector.value : 'gemini-2.5-flash';

  let provider = 'gemini';
  if (selectedModel.startsWith('gpt')) provider = 'openai';
  if (selectedModel.startsWith('claude')) provider = 'anthropic';

  const keys = getStoredApiKeys();
  const apiKey = keys[provider] || keys.gemini || keys.openai;

  // Fallback to Demo Simulation if no API Key configured
  if (!apiKey) {
    runDemoWorkflow(userMessage);
    return;
  }

  const llm = new LLMClient(provider, apiKey, selectedModel);
  const activeSpecialists = getActiveSubagents().filter(a => !a.isManager);

  try {
    // ── STEP 1: Manager receives prompt and evaluates task dynamically ──
    showSpeechBubble('manager', 'Analyzing task...', 3000);
    if (state.characters['manager']) {
      state.characters['manager'].state = 'working';
    }

    const dynamicManagerPrompt = buildDynamicManagerPrompt();
    const managerEvalResponse = await llm.chat(
      [{ role: 'user', content: userMessage }],
      dynamicManagerPrompt
    );

    let plan = null;
    try {
      const jsonMatch = managerEvalResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) plan = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn('Could not parse Manager JSON evaluation:', e);
    }

    if (!plan) {
      plan = { canSelfHandle: true, directResponse: managerEvalResponse };
    }

    // ── CASE A: Manager handles task directly ──
    if (plan.canSelfHandle || activeSpecialists.length === 0) {
      showSpeechBubble('manager', 'I can handle this directly! ✍️', 3000);
      
      setTimeout(() => {
        if (state.characters['manager']) state.characters['manager'].state = 'talking';
        const finalAnswer = plan.directResponse || managerEvalResponse;
        addChatMessage('ai', finalAnswer, 'ai', 'character_dark_hair_boy');
        if (state.characters['manager']) state.characters['manager'].state = 'idle';
        state.demoRunning = false;
      }, 1500);
      return;
    }

    // ── CASE B: Manager delegates to configured specialist sub-agent ──
    const locs = getOfficeLocations();
    const targetAgentId = plan.delegation?.agentId;
    const subTask = plan.delegation?.subTask || userMessage;
    const specialistAgent = activeSpecialists.find(a => a.id === targetAgentId) || activeSpecialists[0];
    const specialistHome = locs.CHARACTER_HOMES[specialistAgent.id] || { x: 128, y: 150 };

    showSpeechBubble('manager', `Assigning to ${specialistAgent.name}...`, 2500);

    const meetX = specialistHome.x > locs.AISLE_X ? specialistHome.x - 18 : specialistHome.x + 18;
    moveCharacterTo('manager', meetX, specialistHome.y, 'talking', async () => {
      showSpeechBubble('manager', `${specialistAgent.name}, task for you!`, 2500);
      if (state.characters[specialistAgent.id]) {
        state.characters[specialistAgent.id].state = 'talking';
      }

      setTimeout(async () => {
        showSpeechBubble(specialistAgent.id, 'On it! 👍', 2000);
        moveCharacterHome('manager');
        
        // Specialist walks to File Cabinet to inspect reference materials
        moveCharacterTo(specialistAgent.id, locs.FILE_CABINET.x, locs.FILE_CABINET.y, 'working', async () => {
          showSpeechBubble(specialistAgent.id, 'Gathering reference files... 📂', 3000);
          // Execute with subagent's custom system prompt
          const specialistResponse = await llm.chat(
            [{ role: 'user', content: subTask }],
            specialistAgent.systemPrompt || `You are ${specialistAgent.name}, specialized in ${specialistAgent.role}.`
          );

          showSpeechBubble(specialistAgent.id, 'Task complete! ✅', 2000);
          const mgrHome = locs.CHARACTER_HOMES['manager'] || { x: 76, y: 114 };
          moveCharacterTo(specialistAgent.id, mgrHome.x + 18, mgrHome.y, 'talking', () => {
            showSpeechBubble(specialistAgent.id, 'Findings ready!', 2500);
            if (state.characters['manager']) state.characters['manager'].state = 'talking';

            setTimeout(() => {
              showSpeechBubble('manager', 'Excellent! Synthesizing...', 2500);
              moveCharacterHome(specialistAgent.id);
              if (state.characters['manager']) state.characters['manager'].state = 'working';

              setTimeout(() => {
                if (state.characters['manager']) state.characters['manager'].state = 'idle';

                addChatMessage('ai', specialistResponse, 'ai', specialistAgent.spriteName || specialistAgent.id);
                state.demoRunning = false;
              }, 1800);
            }, 1500);
          });
        });
      }, 1500);
    });

  } catch (error) {
    console.error('LLM Workflow Error:', error);
    addChatMessage('ai', `⚠️ **API Error:** ${error.message}\n\nPlease verify your API key in Settings ⚙️.`, 'ai');
    if (state.characters['manager']) state.characters['manager'].state = 'idle';
    state.demoRunning = false;
  }
}

// Simulated Demo Workflow Fallback using active configured subagents
function runDemoWorkflow(userMessage) {
  const locs = getOfficeLocations();
  const activeSpecialists = getActiveSubagents().filter(a => !a.isManager);
  
  if (activeSpecialists.length === 0) {
    showSpeechBubble('manager', 'No subagents active, handling directly!', 2500);
    setTimeout(() => {
      addChatMessage('ai', `I've analyzed your request "${truncate(userMessage, 40)}" as Manager.`, 'ai', 'character_dark_hair_boy');
      state.demoRunning = false;
    }, 1500);
    return;
  }

  const chosen = activeSpecialists[Math.floor(Math.random() * activeSpecialists.length)];
  const chosenHome = locs.CHARACTER_HOMES[chosen.id] || { x: 128, y: 150 };

  const steps = [
    {
      delay: 500,
      action: () => {
        showSpeechBubble('manager', 'New task received! 📋', 2500);
        if (state.characters['manager']) state.characters['manager'].state = 'talking';
      }
    },
    {
      delay: 2000,
      action: () => {
        showSpeechBubble('manager', `Assigning to ${chosen.name}...`, 2000);
        const meetX = chosenHome.x > locs.AISLE_X ? chosenHome.x - 18 : chosenHome.x + 18;
        moveCharacterTo('manager', meetX, chosenHome.y, 'talking', () => {
          showSpeechBubble('manager', `${chosen.name}, could you look into this?`, 2500);
          if (state.characters[chosen.id]) state.characters[chosen.id].state = 'talking';
        });
      }
    },
    {
      delay: 4500,
      action: () => {
        moveCharacterHome('manager');
        moveCharacterTo(chosen.id, locs.FILE_CABINET.x, locs.FILE_CABINET.y, 'working', () => {
          showSpeechBubble(chosen.id, 'Analyzing archive files... 📂', 3000);
        });
      }
    },
    {
      delay: 4500,
      action: () => {
        const mgrHome = locs.CHARACTER_HOMES['manager'] || { x: 76, y: 114 };
        moveCharacterTo(chosen.id, mgrHome.x + 18, mgrHome.y, 'talking', () => {
          showSpeechBubble(chosen.id, 'Results compiled!', 2500);
          if (state.characters['manager']) state.characters['manager'].state = 'talking';
        });
      }
    },
    {
      delay: 3500,
      action: () => {
        moveCharacterHome(chosen.id);
        if (state.characters['manager']) state.characters['manager'].state = 'idle';
        addChatMessage('ai', `I've analyzed "${truncate(userMessage, 40)}" using the **${chosen.name}** subagent (${chosen.role}).\n\n*(Demo mode — configure your API key in Settings ⚙️ for live AI responses)*`, 'ai', chosen.spriteName || chosen.id);
        state.demoRunning = false;
      }
    }
  ];

  let totalDelay = 0;
  steps.forEach(step => {
    totalDelay += step.delay;
    setTimeout(step.action, totalDelay);
  });
}
