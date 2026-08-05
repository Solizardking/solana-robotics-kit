import { describe, it, expect } from 'vitest';
import { createContext } from './_core/context';
import { appRouter } from './routers';

// Create a test context
const createTestContext = () => createContext({ req: {} as any, res: {} as any });

describe('Chat Session Persistence', () => {
  describe('chat.createSession', () => {
    it('creates a new chat session', async () => {
      const ctx = await createTestContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.chat.createSession({
        agentType: 'soltron',
        title: 'Test Session',
      });
      
      expect(result).toBeDefined();
      expect(result.sessionId).toBeDefined();
      expect(typeof result.sessionId).toBe('string');
    });
  });

  describe('chat.addMessage', () => {
    it('adds a message to a session', async () => {
      const ctx = await createTestContext();
      const caller = appRouter.createCaller(ctx);
      
      // First create a session
      const session = await caller.chat.createSession({
        agentType: 'soltron',
        title: 'Test Session for Messages',
      });
      
      // Then add a message
      const result = await caller.chat.addMessage({
        sessionId: session.sessionId,
        role: 'user',
        content: 'Hello SOLtron!',
      });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('chat.getMessages', () => {
    it('retrieves messages from a session', async () => {
      const ctx = await createTestContext();
      const caller = appRouter.createCaller(ctx);
      
      // Create a session and add messages
      const session = await caller.chat.createSession({
        agentType: 'soltron',
        title: 'Test Session for Retrieval',
      });
      
      await caller.chat.addMessage({
        sessionId: session.sessionId,
        role: 'user',
        content: 'Test message 1',
      });
      
      await caller.chat.addMessage({
        sessionId: session.sessionId,
        role: 'assistant',
        content: 'Test response 1',
      });
      
      // Retrieve messages
      const messages = await caller.chat.getMessages({
        sessionId: session.sessionId,
      });
      
      expect(messages).toBeDefined();
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('chat.getSessions', () => {
    it('retrieves chat sessions list', async () => {
      const ctx = await createTestContext();
      const caller = appRouter.createCaller(ctx);
      
      const sessions = await caller.chat.getSessions({
        limit: 10,
      });
      
      expect(sessions).toBeDefined();
      expect(Array.isArray(sessions)).toBe(true);
    });
  });

  describe('chat.deleteSession', () => {
    it('deletes a chat session', async () => {
      const ctx = await createTestContext();
      const caller = appRouter.createCaller(ctx);
      
      // Create a session to delete
      const session = await caller.chat.createSession({
        agentType: 'soltron',
        title: 'Session to Delete',
      });
      
      // Delete it
      const result = await caller.chat.deleteSession({
        sessionId: session.sessionId,
      });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });
});

describe('Voice Integration', () => {
  describe('voice.isConfigured', () => {
    it('returns voice configuration status', async () => {
      const ctx = await createTestContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.voice.isConfigured();
      
      expect(result).toBeDefined();
      expect(typeof result.configured).toBe('boolean');
    });
  });

  describe('voice.getVoices', () => {
    it('returns available voice options', async () => {
      const ctx = await createTestContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.voice.getVoices();
      
      expect(result).toBeDefined();
      // Result may be an array directly or an object with voices property
      const voices = Array.isArray(result) ? result : (result.voices || []);
      expect(Array.isArray(voices)).toBe(true);
      
      // If voices are available, check structure
      if (voices.length > 0) {
        const voice = voices[0];
        expect(voice).toHaveProperty('id');
        expect(voice).toHaveProperty('name');
      }
    });
  });
});
