import { describe, it, expect, vi } from 'vitest';
import {
  isMetaplexConfigured,
  isValidPublicKey,
  getTreeCostEstimate,
  generateRobotPassportMetadata,
  prepareCreateTreeTransaction,
  prepareMintTransaction,
  getUmiConfig,
  TREE_CONFIG,
  type RobotPassportMetadata,
} from './metaplex-bubblegum';

describe('Metaplex Bubblegum Service', () => {
  describe('Configuration', () => {
    it('should check if Metaplex is configured', () => {
      const configured = isMetaplexConfigured();
      // Should return true if HELIUS_RPC_URL or RPC_URL is set
      expect(typeof configured).toBe('boolean');
    });

    it('should return Umi configuration', () => {
      const config = getUmiConfig();
      expect(config).toHaveProperty('rpcUrl');
      expect(config).toHaveProperty('treeConfig');
      expect(config.treeConfig).toEqual(TREE_CONFIG);
    });

    it('should have correct tree configuration defaults', () => {
      expect(TREE_CONFIG.maxDepth).toBe(14);
      expect(TREE_CONFIG.maxBufferSize).toBe(64);
      expect(TREE_CONFIG.canopyDepth).toBe(8);
      expect(TREE_CONFIG.estimatedCapacity).toBe(16384);
    });
  });

  describe('Public Key Validation', () => {
    it('should validate correct Solana public keys', () => {
      // Valid Solana public key (32 bytes base58)
      const validKey = '11111111111111111111111111111111';
      expect(isValidPublicKey(validKey)).toBe(true);
    });

    it('should reject invalid public keys', () => {
      expect(isValidPublicKey('')).toBe(false);
      expect(isValidPublicKey('invalid')).toBe(false);
      expect(isValidPublicKey('0x123')).toBe(false);
    });

    it('should reject keys that are too short', () => {
      expect(isValidPublicKey('abc123')).toBe(false);
    });
  });

  describe('Tree Cost Estimation', () => {
    it('should return correct cost for depth 14', () => {
      const estimate = getTreeCostEstimate(14);
      expect(estimate.costSol).toBe(0.34);
      expect(estimate.capacity).toBe(16384);
    });

    it('should return correct cost for depth 16', () => {
      const estimate = getTreeCostEstimate(16);
      expect(estimate.costSol).toBe(0.71);
      expect(estimate.capacity).toBe(65536);
    });

    it('should return correct cost for depth 18', () => {
      const estimate = getTreeCostEstimate(18);
      expect(estimate.costSol).toBe(2.10);
      expect(estimate.capacity).toBe(262144);
    });

    it('should return correct cost for depth 20', () => {
      const estimate = getTreeCostEstimate(20);
      expect(estimate.costSol).toBe(8.50);
      expect(estimate.capacity).toBe(1048576);
    });

    it('should return correct cost for depth 24', () => {
      const estimate = getTreeCostEstimate(24);
      expect(estimate.costSol).toBe(26.12);
      expect(estimate.capacity).toBe(16777216);
    });

    it('should return default cost for unknown depth', () => {
      const estimate = getTreeCostEstimate(10);
      expect(estimate.costSol).toBe(0.34);
      expect(estimate.capacity).toBe(1024);
    });
  });

  describe('Robot Passport Metadata Generation', () => {
    it('should generate valid metadata with required fields', () => {
      const metadata = generateRobotPassportMetadata(
        'ROBOT-001',
        'TestBot',
        '11111111111111111111111111111111',
        'https://example.com/image.png'
      );

      expect(metadata.name).toBe('Robot Passport: TestBot');
      expect(metadata.symbol).toBe('RPASS');
      expect(metadata.image).toBe('https://example.com/image.png');
      expect(metadata.description).toContain('TestBot');
    });

    it('should include default attributes', () => {
      const metadata = generateRobotPassportMetadata(
        'ROBOT-001',
        'TestBot',
        '11111111111111111111111111111111',
        'https://example.com/image.png'
      );

      const attributes = metadata.attributes;
      expect(attributes.some(a => a.trait_type === 'Robot ID')).toBe(true);
      expect(attributes.some(a => a.trait_type === 'Status')).toBe(true);
      expect(attributes.some(a => a.trait_type === 'Clearance Level')).toBe(true);
    });

    it('should include custom attributes', () => {
      const metadata = generateRobotPassportMetadata(
        'ROBOT-001',
        'TestBot',
        '11111111111111111111111111111111',
        'https://example.com/image.png',
        { 'Custom Trait': 'Custom Value', 'Power Level': 9000 }
      );

      const attributes = metadata.attributes;
      expect(attributes.some(a => a.trait_type === 'Custom Trait' && a.value === 'Custom Value')).toBe(true);
      expect(attributes.some(a => a.trait_type === 'Power Level' && a.value === 9000)).toBe(true);
    });

    it('should truncate owner address in attributes', () => {
      const longAddress = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456';
      const metadata = generateRobotPassportMetadata(
        'ROBOT-001',
        'TestBot',
        longAddress,
        'https://example.com/image.png'
      );

      const ownerAttr = metadata.attributes.find(a => a.trait_type === 'Owner');
      expect(ownerAttr?.value).toContain('...');
    });

    it('should include properties with files', () => {
      const metadata = generateRobotPassportMetadata(
        'ROBOT-001',
        'TestBot',
        '11111111111111111111111111111111',
        'https://example.com/image.png'
      );

      expect(metadata.properties).toBeDefined();
      expect(metadata.properties?.files).toHaveLength(1);
      expect(metadata.properties?.files?.[0].uri).toBe('https://example.com/image.png');
      expect(metadata.properties?.files?.[0].type).toBe('image/png');
    });

    it('should set external URL', () => {
      const metadata = generateRobotPassportMetadata(
        'ROBOT-001',
        'TestBot',
        '11111111111111111111111111111111',
        'https://example.com/image.png'
      );

      expect(metadata.externalUrl).toBe('https://solanarobotics.org/passport');
    });
  });

  describe('Transaction Preparation', () => {
    it('should prepare create tree transaction with defaults', () => {
      const txData = prepareCreateTreeTransaction('11111111111111111111111111111111');

      expect(txData.treeCreator).toBe('11111111111111111111111111111111');
      expect(txData.maxDepth).toBe(TREE_CONFIG.maxDepth);
      expect(txData.maxBufferSize).toBe(TREE_CONFIG.maxBufferSize);
      expect(txData.canopyDepth).toBe(TREE_CONFIG.canopyDepth);
      expect(txData.isPublic).toBe(false);
    });

    it('should prepare create tree transaction with custom params', () => {
      const txData = prepareCreateTreeTransaction(
        '11111111111111111111111111111111',
        20,
        1024,
        true
      );

      expect(txData.maxDepth).toBe(20);
      expect(txData.maxBufferSize).toBe(1024);
      expect(txData.isPublic).toBe(true);
      expect(txData.estimatedCapacity).toBe(1048576);
    });

    it('should prepare mint transaction', () => {
      const metadata: RobotPassportMetadata = {
        name: 'Test Passport',
        symbol: 'TEST',
        description: 'Test description',
        image: 'https://example.com/image.png',
        attributes: [{ trait_type: 'Test', value: 'Value' }],
      };

      const txData = prepareMintTransaction(
        '22222222222222222222222222222222',
        '11111111111111111111111111111111',
        metadata
      );

      expect(txData.merkleTree).toBe('22222222222222222222222222222222');
      expect(txData.leafOwner).toBe('11111111111111111111111111111111');
      expect(txData.metadata.name).toBe('Test Passport');
      expect(txData.metadata.sellerFeeBasisPoints).toBe(500);
      expect(txData.rawMetadata).toEqual(metadata);
    });

    it('should prepare mint transaction with collection', () => {
      const metadata: RobotPassportMetadata = {
        name: 'Test Passport',
        symbol: 'TEST',
        description: 'Test description',
        image: 'https://example.com/image.png',
        attributes: [],
      };

      const txData = prepareMintTransaction(
        '22222222222222222222222222222222',
        '11111111111111111111111111111111',
        metadata,
        '33333333333333333333333333333333'
      );

      expect(txData.metadata.collection).toEqual({
        key: '33333333333333333333333333333333',
        verified: false,
      });
    });

    it('should prepare mint transaction without collection', () => {
      const metadata: RobotPassportMetadata = {
        name: 'Test Passport',
        symbol: 'TEST',
        description: 'Test description',
        image: 'https://example.com/image.png',
        attributes: [],
      };

      const txData = prepareMintTransaction(
        '22222222222222222222222222222222',
        '11111111111111111111111111111111',
        metadata
      );

      expect(txData.metadata.collection).toBeNull();
    });
  });
});
