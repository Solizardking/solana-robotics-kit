/**
 * OpenVoice Client Integration for Ralph
 * 
 * Connects Ralph terminal agent to the OpenVoice server for voice interactions
 */

import { OpenAI } from "openai";

export interface OpenVoiceConfig {
  serverUrl: string;
  activeVoice?: string;
}

export class OpenVoiceClient {
  private serverUrl: string;
  private activeVoice: string | null = null;

  constructor(config: OpenVoiceConfig) {
    this.serverUrl = config.serverUrl.replace(/\/$/, '');
    this.activeVoice = config.activeVoice || null;
  }

  /**
   * Check if OpenVoice server is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List available voice profiles
   */
  async listVoices(): Promise<any[]> {
    try {
      const response = await fetch(`${this.serverUrl}/api/voices`);
      const data = await response.json();
      return data.success ? data.voices : [];
    } catch {
      return [];
    }
  }

  /**
   * Activate a voice profile
   */
  async activateVoice(voiceName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/api/voices/${voiceName}/activate`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        this.activeVoice = voiceName;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Synthesize text to speech
   */
  async synthesize(text: string, options?: {
    voice?: string;
    language?: string;
    speed?: number;
  }): Promise<string | null> {
    try {
      const response = await fetch(`${this.serverUrl}/api/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: options?.voice || this.activeVoice,
          language: options?.language || 'EN',
          speed: options?.speed || 1.0
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        return url;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Process audio (STT -> AI -> TTS pipeline)
   */
  async processAudio(audioBlob: Blob): Promise<{
    transcribedText?: string;
    responseText?: string;
    audioUrl?: string;
  } | null> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch(`${this.serverUrl}/api/process_audio`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        return {
          transcribedText: data.transcribed_text,
          responseText: data.response_text,
          audioUrl: data.audio_url ? `${this.serverUrl}${data.audio_url}` : undefined
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}

/**
 * Integration helper to add voice responses to Ralph
 */
export async function addVoiceToRalphResponse(
  openaiClient: OpenAI,
  models: { fast: string; reason: string; code: string },
  userText: string,
  openVoiceClient: OpenVoiceClient
): Promise<string | null> {
  // Get AI response using Ralph's routing
  // (This would integrate with Ralph's existing routing logic)
  
  // For now, return null - this is a placeholder for integration
  return null;
}
