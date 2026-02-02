/**
 * Prompt Registry - Dynamic Prompt Management System
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * This module manages prompt versions and provides dynamic prompt injection for LLM calls.
 * Supports versioning, A/B testing, and rollback capabilities.
 */

// ============================================================================
// Prompt Registry Logic Start Here
// ============================================================================

import * as fs from 'fs';
import * as path from 'path';

export interface PromptVersion {
  file: string;
  description: string;
  createdAt: string;
  isActive?: boolean;
}

export interface PromptRegistry {
  version: string;
  lastModified: string;
  activePrompts: Record<string, string>;
  prompts: Record<string, Record<string, PromptVersion>>;
}

export class PromptRegistryManager {
  private registryPath: string;
  private promptsDir: string;
  private registry: PromptRegistry | null = null;
  private promptCache: Map<string, string> = new Map();

  constructor(registryPath?: string, promptsDir?: string) {
    this.registryPath = registryPath || path.join(__dirname, 'registry.json');
    this.promptsDir = promptsDir || path.join(__dirname);
    this.loadRegistry();
  }

  /**
   * Loads the prompt registry from JSON file
   */
  private loadRegistry(): void {
    try {
      if (fs.existsSync(this.registryPath)) {
        const content = fs.readFileSync(this.registryPath, 'utf-8');
        this.registry = JSON.parse(content);
      } else {
        // Create default registry if it doesn't exist
        this.registry = {
          version: '1.0.0',
          lastModified: new Date().toISOString(),
          activePrompts: {
            planner: 'planner.v2',
            response: 'response.v1',
          },
          prompts: {},
        };
        this.saveRegistry();
      }
    } catch (error) {
      console.error('Error loading prompt registry:', error);
      throw new Error('Failed to load prompt registry');
    }
  }

  /**
   * Saves the prompt registry to JSON file
   */
  private saveRegistry(): void {
    try {
      if (this.registry) {
        this.registry.lastModified = new Date().toISOString();
        fs.writeFileSync(
          this.registryPath,
          JSON.stringify(this.registry, null, 2),
          'utf-8'
        );
      }
    } catch (error) {
      console.error('Error saving prompt registry:', error);
      throw new Error('Failed to save prompt registry');
    }
  }

  /**
   * Gets the active prompt for an agent type
   */
  getActivePrompt(agentType: string): string | null {
    if (!this.registry) {
      this.loadRegistry();
    }

    const activeVersion = this.registry?.activePrompts[agentType];
    if (!activeVersion) {
      return null;
    }

    return this.getPrompt(agentType, activeVersion);
  }

  /**
   * Gets a specific prompt version for an agent type
   */
  getPrompt(agentType: string, version: string): string | null {
    const cacheKey = `${agentType}.${version}`;

    // Check cache first
    if (this.promptCache.has(cacheKey)) {
      return this.promptCache.get(cacheKey) || null;
    }

    if (!this.registry) {
      this.loadRegistry();
    }

    const promptVersion = this.registry?.prompts[agentType]?.[version];
    if (!promptVersion) {
      console.warn(`Prompt not found: ${agentType}.${version}`);
      return null;
    }

    // Load prompt from file
    const promptFilePath = path.join(this.promptsDir, promptVersion.file);
    try {
      if (fs.existsSync(promptFilePath)) {
        const promptContent = fs.readFileSync(promptFilePath, 'utf-8');
        // Cache the prompt
        this.promptCache.set(cacheKey, promptContent);
        return promptContent;
      } else {
        console.error(`Prompt file not found: ${promptFilePath}`);
        return null;
      }
    } catch (error) {
      console.error(`Error reading prompt file ${promptFilePath}:`, error);
      return null;
    }
  }

  /**
   * Sets the active prompt version for an agent type
   */
  setActivePrompt(agentType: string, version: string): boolean {
    if (!this.registry) {
      this.loadRegistry();
    }

    // Validate that the version exists
    if (!this.registry?.prompts[agentType]?.[version]) {
      console.error(`Prompt version not found: ${agentType}.${version}`);
      return false;
    }

    if (this.registry) {
      this.registry.activePrompts[agentType] = version;
      this.saveRegistry();
      
      // Clear cache for this agent type
      const keysToDelete: string[] = [];
      this.promptCache.forEach((_, key) => {
        if (key.startsWith(`${agentType}.`)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.promptCache.delete(key));

      return true;
    }

    return false;
  }

  /**
   * Gets active prompt version for an agent type
   */
  getActiveVersion(agentType: string): string | null {
    if (!this.registry) {
      this.loadRegistry();
    }
    return this.registry?.activePrompts[agentType] || null;
  }

  /**
   * Registers a new prompt version
   */
  registerPrompt(
    agentType: string,
    version: string,
    file: string,
    description: string
  ): boolean {
    if (!this.registry) {
      this.loadRegistry();
    }

    if (!this.registry) {
      return false;
    }

    if (!this.registry.prompts[agentType]) {
      this.registry.prompts[agentType] = {};
    }

    this.registry.prompts[agentType][version] = {
      file,
      description,
      createdAt: new Date().toISOString(),
    };

    this.saveRegistry();
    return true;
  }

  /**
   * Gets all available versions for an agent type
   */
  getAvailableVersions(agentType: string): string[] {
    if (!this.registry) {
      this.loadRegistry();
    }

    return Object.keys(this.registry?.prompts[agentType] || {});
  }

  /**
   * Gets the registry metadata
   */
  getRegistry(): PromptRegistry | null {
    if (!this.registry) {
      this.loadRegistry();
    }
    return this.registry;
  }

  /**
   * Clears the prompt cache
   */
  clearCache(): void {
    this.promptCache.clear();
  }

  /**
   * Builds a prompt with dynamic context injection
   */
  buildPrompt(
    agentType: string,
    context?: Record<string, any>
  ): string | null {
    const basePrompt = this.getActivePrompt(agentType);
    if (!basePrompt) {
      return null;
    }

    if (!context || Object.keys(context).length === 0) {
      return basePrompt;
    }

    // Replace placeholders in the prompt
    let prompt = basePrompt;
    for (const [key, value] of Object.entries(context)) {
      const placeholder = `{{${key}}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return prompt;
  }
}

// ============================================================================
// Prompt Registry Logic End Here
// ============================================================================

// Export singleton instance
export const promptRegistry = new PromptRegistryManager();

