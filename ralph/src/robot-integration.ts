/**
 * Robot Integration Module for Ralph
 * 
 * Connects Ralph terminal agent to the Solana Desktop Robot component
 * via OpenVoice server integration
 */

import { OpenVoiceClient } from './openvoice-client.js';

export interface RobotConfig {
  openvoiceUrl: string;
  activeVoice?: string;
}

export class RobotIntegration {
  private openVoice: OpenVoiceClient;
  private isEnabled: boolean = false;

  constructor(config: RobotConfig) {
    this.openVoice = new OpenVoiceClient({
      serverUrl: config.openvoiceUrl,
      activeVoice: config.activeVoice
    });
  }

  /**
   * Initialize robot integration
   */
  async initialize(): Promise<boolean> {
    const isAvailable = await this.openVoice.checkHealth();
    this.isEnabled = isAvailable;
    
    if (isAvailable) {
      const voices = await this.openVoice.listVoices();
      if (voices.length > 0 && !this.openVoice['activeVoice']) {
        await this.openVoice.activateVoice(voices[0].name);
      }
    }
    
    return isAvailable;
  }

  /**
   * Speak a message through the robot
   */
  async speak(message: string): Promise<boolean> {
    if (!this.isEnabled) return false;
    
    try {
      const audioUrl = await this.openVoice.synthesize(message);
      return audioUrl !== null;
    } catch {
      return false;
    }
  }

  /**
   * Process audio input and get AI response
   */
  async processAudio(audioBlob: Blob): Promise<{
    transcribedText?: string;
    responseText?: string;
    audioUrl?: string;
  } | null> {
    if (!this.isEnabled) return null;
    return await this.openVoice.processAudio(audioBlob);
  }

  /**
   * Check if robot is available
   */
  isAvailable(): boolean {
    return this.isEnabled;
  }
}

/**
 * Helper to add robot voice responses to Ralph's output
 */
export async function addRobotVoiceToRalph(
  message: string,
  robotIntegration: RobotIntegration
): Promise<void> {
  if (robotIntegration.isAvailable()) {
    await robotIntegration.speak(message);
  }
}
