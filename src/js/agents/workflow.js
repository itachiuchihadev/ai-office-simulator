import { state } from '../config.js';
import { truncate } from '../utils.js';
import { getOfficeLocations } from '../office/rooms.js';
import { getActiveSubagents, buildDynamicManagerPrompt } from './subagent-manager.js';
import { moveCharacterTo, moveCharacterHome, showSpeechBubble } from '../office/characters.js';
import { addChatMessage } from '../chat/chat-ui.js';
import { LLMClient } from '../api/llm-client.js';
import { ManagerDelegationSchema } from '../api/schemas.js';
import { getStoredApiKeys } from '../ui/settings-modal.js';

export async function runWorkflow(userMessage) {
  if (state.demoRunning) return;
  state.demoRunning = true;

  const modelSelector = document.getElementById('modelSelector');
  const selectedModel = modelSelector ? modelSelector.value : '';

  let provider = 'gemini';
  if (selectedModel.startsWith('gpt') || selectedModel.startsWith('o1') || selectedModel.startsWith('o3')) {
    provider = 'openai';
  } else if (selectedModel.startsWith('claude')) {
    provider = 'anthropic';
  }

  const keys = getStoredApiKeys();
  const apiKey = keys[provider] || keys.gemini || keys.openai;

  // Fallback to Demo Simulation if no API Key or no Model configured
  if (!apiKey || !selectedModel) {
    runDemoWorkflow(userMessage);
    return;
  }

  const llm = new LLMClient(provider, apiKey, selectedModel);
  const activeSpecialists = getActiveSubagents().filter(a => !a.isManager);

  try {
    // ── STEP 1: Manager receives prompt & executes Native Structured Output LLM Evaluation ──
    showSpeechBubble('manager', 'Evaluating task...', 3000);
    if (state.characters['manager']) {
      state.characters['manager'].state = 'working';
    }

    const dynamicManagerPrompt = buildDynamicManagerPrompt();
    const schema = new ManagerDelegationSchema(activeSpecialists.map(a => a.id));

    // Native schema constrained call (Gemini responseSchema / OpenAI json_schema)
    const plan = await llm.chatStructured(
      [{ role: 'user', content: userMessage }],
      schema,
      dynamicManagerPrompt
    );

    // ── CASE A: Manager handles task directly ──
    if (plan.canSelfHandle || activeSpecialists.length === 0) {
      showSpeechBubble('manager', 'I can handle this directly! ✍️', 3000);
      
      setTimeout(() => {
        if (state.characters['manager']) state.characters['manager'].state = 'talking';
        const finalAnswer = plan.directResponse || managerEvalResponse;
        addChatMessage('Manager', finalAnswer, 'ai', 'character_dark_hair_boy');
        if (state.characters['manager']) state.characters['manager'].state = 'idle';
        state.demoRunning = false;
      }, 1500);
      return;
    }

    // ── CASE B: Manager delegates to the specific sub-agent chosen by LLM ──
    const locs = getOfficeLocations();
    const targetAgentId = plan.delegation?.agentId;
    const subTask = plan.delegation?.subTask || userMessage;

    // Strictly match whichever subagent ID the Manager LLM selected
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
        
        // Specialist walks to workstation or archives to execute subtask
        moveCharacterTo(specialistAgent.id, locs.FILE_CABINET.x, locs.FILE_CABINET.y, 'working', async () => {
          showSpeechBubble(specialistAgent.id, `${specialistAgent.name} is on task... ⚙️`, 3000);
          
          // Execute with the chosen subagent's custom system prompt
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

                addChatMessage(
                  specialistAgent.name,
                  specialistResponse,
                  'ai',
                  specialistAgent.spriteName || specialistAgent.id
                );
                state.demoRunning = false;
              }, 1800);
            }, 1500);
          });
        });
      }, 1500);
    });

  } catch (error) {
    console.error('LLM Workflow Error:', error);
    addChatMessage('System', `⚠️ **API Error:** ${error.message}\n\nPlease verify your API key in Settings ⚙️.`, 'ai');
    if (state.characters['manager']) state.characters['manager'].state = 'idle';
    state.demoRunning = false;
  }
}

/**
 * Dynamic specialist evaluation for simulation / demo mode.
 * Evaluates semantic relevance against each subagent's configured name, role, and system prompt.
 */
function selectSpecialistDynamically(userMessage, activeSpecialists) {
  const promptTokens = (userMessage || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

  let bestAgent = activeSpecialists[0];
  let maxScore = -1;

  activeSpecialists.forEach(agent => {
    let score = 0;
    const agentProfile = `${agent.name} ${agent.role} ${agent.systemPrompt || ''}`.toLowerCase();

    promptTokens.forEach(token => {
      if (token.length > 2 && agentProfile.includes(token)) {
        score += 2;
      }
    });

    if (score > maxScore) {
      maxScore = score;
      bestAgent = agent;
    }
  });

  return bestAgent;
}

/**
 * Generates a contextual simulated response using the configured agent's role & prompt
 */
function generateDynamicSimulatedResponse(agent, userMessage) {
  return `### 📋 ${agent.name} (${agent.role}) Report\n\n**Assignment Summary:** "${truncate(userMessage, 40)}"\n\n**Specialist Execution:**\n- Processed in accordance with system prompt: *"${truncate(agent.systemPrompt || agent.role, 60)}"*.\n- Task synthesized and validated.\n\n*(Demo mode — configure your API key in Settings ⚙️ for live AI responses)*`;
}

// Simulated Demo Workflow Fallback using active configured subagents
function runDemoWorkflow(userMessage) {
  const locs = getOfficeLocations();
  const activeSpecialists = getActiveSubagents().filter(a => !a.isManager);
  
  if (activeSpecialists.length === 0) {
    showSpeechBubble('manager', 'No subagents active, handling directly!', 2500);
    setTimeout(() => {
      addChatMessage('Manager', `I've analyzed your request "${truncate(userMessage, 40)}" as Manager.`, 'ai', 'character_dark_hair_boy');
      state.demoRunning = false;
    }, 1500);
    return;
  }

  const chosen = selectSpecialistDynamically(userMessage, activeSpecialists);
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
          showSpeechBubble(chosen.id, `${chosen.name} is working on this task... ⚙️`, 3000);
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
        addChatMessage(chosen.name, generateDynamicSimulatedResponse(chosen, userMessage), 'ai', chosen.spriteName || chosen.id);
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
