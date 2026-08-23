// js/api/schemas.js — Strongly Typed Schema Definitions & Generators for Native Structured Outputs

/**
 * Encapsulates a structured delegation decision from the Manager LLM
 */
export class DelegationDecision {
  constructor({ canSelfHandle = false, reasoning = '', directResponse = '', delegation = null } = {}) {
    this.canSelfHandle = Boolean(canSelfHandle);
    this.reasoning = String(reasoning || '');
    this.directResponse = String(directResponse || '');
    this.delegation = delegation && typeof delegation === 'object' ? {
      agentId: String(delegation.agentId || ''),
      subTask: String(delegation.subTask || '')
    } : null;
  }
}

/**
 * Base Schema class providing bidirectional formatting for Gemini and OpenAI
 */
export class StructuredSchema {
  constructor(name, description) {
    this.name = name;
    this.description = description;
  }

  toGeminiSchema() {
    throw new Error('toGeminiSchema() must be implemented by subclass.');
  }

  toOpenAISchema() {
    throw new Error('toOpenAISchema() must be implemented by subclass.');
  }

  parse(rawJsonOrObj) {
    const obj = typeof rawJsonOrObj === 'string' ? JSON.parse(rawJsonOrObj) : rawJsonOrObj;
    return obj;
  }
}

/**
 * Dynamic Manager Delegation Schema Generator.
 * Constrains the LLM to output only valid active subagent IDs.
 */
export class ManagerDelegationSchema extends StructuredSchema {
  constructor(validAgentIds = []) {
    super('ManagerDelegationPlan', 'Structured task evaluation and specialist subagent delegation plan');
    this.validAgentIds = Array.isArray(validAgentIds) && validAgentIds.length > 0
      ? validAgentIds
      : ['none'];
  }

  /**
   * Gemini generationConfig.responseSchema specification
   */
  toGeminiSchema() {
    return {
      type: 'OBJECT',
      description: this.description,
      properties: {
        canSelfHandle: {
          type: 'BOOLEAN',
          description: 'True only if the prompt is a simple greeting or no specialists are available'
        },
        reasoning: {
          type: 'STRING',
          description: 'Explanation for why the decision or delegation was chosen'
        },
        directResponse: {
          type: 'STRING',
          description: 'Direct answer text when canSelfHandle is true (leave empty string otherwise)'
        },
        delegation: {
          type: 'OBJECT',
          description: 'Delegation instruction object when canSelfHandle is false',
          properties: {
            agentId: {
              type: 'STRING',
              enum: this.validAgentIds,
              description: 'The exact ID of the chosen specialist subagent'
            },
            subTask: {
              type: 'STRING',
              description: 'Detailed instructions for the specialist subagent to execute'
            }
          },
          required: ['agentId', 'subTask']
        }
      },
      required: ['canSelfHandle', 'reasoning']
    };
  }

  /**
   * OpenAI response_format json_schema specification with strict: true
   */
  toOpenAISchema() {
    return {
      name: this.name,
      description: this.description,
      strict: true,
      schema: {
        type: 'object',
        properties: {
          canSelfHandle: {
            type: 'boolean',
            description: 'True only if the prompt is a simple greeting or pleasantry'
          },
          reasoning: {
            type: 'string',
            description: 'Explanation for the routing decision'
          },
          directResponse: {
            type: 'string',
            description: 'Direct answer when canSelfHandle is true, or empty string'
          },
          delegation: {
            type: 'object',
            description: 'Delegation parameters',
            properties: {
              agentId: {
                type: 'string',
                enum: this.validAgentIds,
                description: 'The target specialist agent ID'
              },
              subTask: {
                type: 'string',
                description: 'Task assigned to the specialist'
              }
            },
            required: ['agentId', 'subTask'],
            additionalProperties: false
          }
        },
        required: ['canSelfHandle', 'reasoning', 'directResponse', 'delegation'],
        additionalProperties: false
      }
    };
  }

  /**
   * Parses and validates raw LLM output into a typed DelegationDecision instance
   */
  parse(rawOutput) {
    const raw = typeof rawOutput === 'string' ? JSON.parse(rawOutput) : rawOutput;
    return new DelegationDecision(raw);
  }
}
