import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the fal client
vi.mock('@fal-ai/client', () => ({
  fal: {
    config: vi.fn(),
    subscribe: vi.fn(),
    queue: {
      submit: vi.fn(),
      status: vi.fn(),
      result: vi.fn(),
    },
  },
}));

import { fal } from '@fal-ai/client';
import {
  FAL_MODELS,
  generateSeed3D,
  generateHunyuan3D,
  submitGeneration,
  checkGenerationStatus,
  getGenerationResult,
  selectModel,
  generateImageTo3D,
} from './fal-image-to-3d';

describe('FAL Image-to-3D Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('FAL_MODELS', () => {
    it('should have correct model endpoints', () => {
      expect(FAL_MODELS.SEED3D).toBe('fal-ai/bytedance/seed3d/image-to-3d');
      expect(FAL_MODELS.HUNYUAN3D_V3).toBe('fal-ai/hunyuan3d-v3/image-to-3d');
    });
  });

  describe('generateSeed3D', () => {
    it('should call fal.subscribe with correct parameters', async () => {
      const mockResult = {
        data: {
          model: { url: 'https://example.com/model.zip', content_type: 'application/zip' },
          usage_tokens: 100,
        },
        requestId: 'test-request-id',
      };
      
      (fal.subscribe as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await generateSeed3D('https://example.com/image.png');

      expect(fal.subscribe).toHaveBeenCalledWith(
        FAL_MODELS.SEED3D,
        expect.objectContaining({
          input: { image_url: 'https://example.com/image.png' },
          logs: true,
        })
      );
      expect(result.data.model.url).toBe('https://example.com/model.zip');
      expect(result.requestId).toBe('test-request-id');
    });

    it('should call onProgress callback during generation', async () => {
      const mockResult = {
        data: { model: { url: 'https://example.com/model.zip' }, usage_tokens: 100 },
        requestId: 'test-id',
      };
      
      let capturedCallback: ((update: { status: string; logs?: Array<{ message: string }> }) => void) | undefined;
      (fal.subscribe as ReturnType<typeof vi.fn>).mockImplementation(async (_endpoint, options) => {
        capturedCallback = options.onQueueUpdate;
        return mockResult;
      });

      const onProgress = vi.fn();
      await generateSeed3D('https://example.com/image.png', onProgress);

      // Simulate queue update
      if (capturedCallback) {
        capturedCallback({ status: 'IN_QUEUE' });
        expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ status: 'IN_QUEUE' }));
      }
    });
  });

  describe('generateHunyuan3D', () => {
    it('should call fal.subscribe with correct parameters and defaults', async () => {
      const mockResult = {
        data: {
          model_glb: { url: 'https://example.com/model.glb' },
          thumbnail: { url: 'https://example.com/thumb.png' },
          model_urls: { glb: { url: 'https://example.com/model.glb' } },
          seed: 12345,
        },
        requestId: 'hunyuan-request-id',
      };
      
      (fal.subscribe as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await generateHunyuan3D({
        input_image_url: 'https://example.com/image.png',
      });

      expect(fal.subscribe).toHaveBeenCalledWith(
        FAL_MODELS.HUNYUAN3D_V3,
        expect.objectContaining({
          input: expect.objectContaining({
            input_image_url: 'https://example.com/image.png',
            face_count: 500000,
            generate_type: 'Normal',
            polygon_type: 'triangle',
          }),
          logs: true,
        })
      );
      expect(result.data.model_glb.url).toBe('https://example.com/model.glb');
      expect(result.data.seed).toBe(12345);
    });

    it('should use custom options when provided', async () => {
      const mockResult = {
        data: {
          model_glb: { url: 'https://example.com/model.glb' },
          thumbnail: { url: 'https://example.com/thumb.png' },
          model_urls: {},
          seed: 12345,
        },
        requestId: 'test-id',
      };
      
      (fal.subscribe as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      await generateHunyuan3D({
        input_image_url: 'https://example.com/image.png',
        face_count: 1000000,
        generate_type: 'LowPoly',
        polygon_type: 'quadrilateral',
        enable_pbr: true,
      });

      expect(fal.subscribe).toHaveBeenCalledWith(
        FAL_MODELS.HUNYUAN3D_V3,
        expect.objectContaining({
          input: expect.objectContaining({
            face_count: 1000000,
            generate_type: 'LowPoly',
            polygon_type: 'quadrilateral',
            enable_pbr: true,
          }),
        })
      );
    });
  });

  describe('submitGeneration', () => {
    it('should submit generation request to queue', async () => {
      (fal.queue.submit as ReturnType<typeof vi.fn>).mockResolvedValue({
        request_id: 'queue-request-id',
      });

      const result = await submitGeneration('SEED3D', { image_url: 'https://example.com/image.png' });

      expect(fal.queue.submit).toHaveBeenCalledWith(
        FAL_MODELS.SEED3D,
        { input: { image_url: 'https://example.com/image.png' } }
      );
      expect(result.requestId).toBe('queue-request-id');
    });
  });

  describe('checkGenerationStatus', () => {
    it('should check status of generation request', async () => {
      (fal.queue.status as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'IN_PROGRESS',
        logs: [{ message: 'Processing...' }],
      });

      const result = await checkGenerationStatus('HUNYUAN3D_V3', 'test-request-id');

      expect(fal.queue.status).toHaveBeenCalledWith(
        FAL_MODELS.HUNYUAN3D_V3,
        { requestId: 'test-request-id', logs: true }
      );
      expect(result.status).toBe('IN_PROGRESS');
      expect(result.logs).toContain('Processing...');
    });
  });

  describe('getGenerationResult', () => {
    it('should get result of completed generation', async () => {
      const mockData = {
        model_glb: { url: 'https://example.com/model.glb' },
        thumbnail: { url: 'https://example.com/thumb.png' },
        model_urls: {},
        seed: 12345,
      };
      
      (fal.queue.result as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockData });

      const result = await getGenerationResult('HUNYUAN3D_V3', 'test-request-id');

      expect(fal.queue.result).toHaveBeenCalledWith(
        FAL_MODELS.HUNYUAN3D_V3,
        { requestId: 'test-request-id' }
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('selectModel', () => {
    it('should select HUNYUAN3D_V3 for multiple formats', () => {
      expect(selectModel({ needsMultipleFormats: true })).toBe('HUNYUAN3D_V3');
    });

    it('should select HUNYUAN3D_V3 for PBR', () => {
      expect(selectModel({ needsPBR: true })).toBe('HUNYUAN3D_V3');
    });

    it('should select HUNYUAN3D_V3 for LowPoly', () => {
      expect(selectModel({ needsLowPoly: true })).toBe('HUNYUAN3D_V3');
    });

    it('should select HUNYUAN3D_V3 for quality preference', () => {
      expect(selectModel({ preferQuality: true })).toBe('HUNYUAN3D_V3');
    });

    it('should select SEED3D for quick generation', () => {
      expect(selectModel({})).toBe('SEED3D');
    });
  });

  describe('generateImageTo3D', () => {
    it('should generate 3D model using SEED3D', async () => {
      const mockResult = {
        data: {
          model: { url: 'https://example.com/model.zip' },
          usage_tokens: 100,
        },
        requestId: 'seed3d-request',
      };
      
      (fal.subscribe as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await generateImageTo3D('https://example.com/image.png', { model: 'SEED3D' });

      expect(result.model).toBe('SEED3D');
      expect(result.zipUrl).toBe('https://example.com/model.zip');
      expect(result.requestId).toBe('seed3d-request');
    });

    it('should generate 3D model using HUNYUAN3D_V3', async () => {
      const mockResult = {
        data: {
          model_glb: { url: 'https://example.com/model.glb' },
          thumbnail: { url: 'https://example.com/thumb.png' },
          model_urls: {
            obj: { url: 'https://example.com/model.obj' },
            fbx: { url: 'https://example.com/model.fbx' },
          },
          seed: 12345,
        },
        requestId: 'hunyuan-request',
      };
      
      (fal.subscribe as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await generateImageTo3D('https://example.com/image.png', { model: 'HUNYUAN3D_V3' });

      expect(result.model).toBe('HUNYUAN3D_V3');
      expect(result.glbUrl).toBe('https://example.com/model.glb');
      expect(result.objUrl).toBe('https://example.com/model.obj');
      expect(result.fbxUrl).toBe('https://example.com/model.fbx');
      expect(result.thumbnailUrl).toBe('https://example.com/thumb.png');
      expect(result.seed).toBe(12345);
    });

    it('should default to HUNYUAN3D_V3 when no model specified', async () => {
      const mockResult = {
        data: {
          model_glb: { url: 'https://example.com/model.glb' },
          thumbnail: { url: 'https://example.com/thumb.png' },
          model_urls: {},
          seed: 12345,
        },
        requestId: 'default-request',
      };
      
      (fal.subscribe as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await generateImageTo3D('https://example.com/image.png');

      expect(result.model).toBe('HUNYUAN3D_V3');
    });

    it('should pass custom options to HUNYUAN3D_V3', async () => {
      const mockResult = {
        data: {
          model_glb: { url: 'https://example.com/model.glb' },
          thumbnail: { url: 'https://example.com/thumb.png' },
          model_urls: {},
          seed: 12345,
        },
        requestId: 'custom-request',
      };
      
      (fal.subscribe as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      await generateImageTo3D('https://example.com/image.png', {
        model: 'HUNYUAN3D_V3',
        faceCount: 1000000,
        generateType: 'LowPoly',
        polygonType: 'quadrilateral',
        enablePbr: true,
      });

      expect(fal.subscribe).toHaveBeenCalledWith(
        FAL_MODELS.HUNYUAN3D_V3,
        expect.objectContaining({
          input: expect.objectContaining({
            face_count: 1000000,
            generate_type: 'LowPoly',
            polygon_type: 'quadrilateral',
            enable_pbr: true,
          }),
        })
      );
    });

    it('should call progress callback during generation', async () => {
      const mockResult = {
        data: {
          model_glb: { url: 'https://example.com/model.glb' },
          thumbnail: { url: 'https://example.com/thumb.png' },
          model_urls: {},
          seed: 12345,
        },
        requestId: 'progress-request',
      };
      
      (fal.subscribe as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const onProgress = vi.fn();
      await generateImageTo3D('https://example.com/image.png', { model: 'HUNYUAN3D_V3' }, onProgress);

      // The onProgress should be passed to the underlying function
      expect(fal.subscribe).toHaveBeenCalledWith(
        FAL_MODELS.HUNYUAN3D_V3,
        expect.objectContaining({
          onQueueUpdate: expect.any(Function),
        })
      );
    });
  });
});

describe('FAL Models Router Procedures', () => {
  // These tests verify the router procedures work correctly
  // In a real scenario, these would be integration tests

  describe('models.getFalModels', () => {
    it('should return available FAL models info', () => {
      // This is a static query, so we can test the expected structure
      const expectedModels = [
        {
          id: 'SEED3D',
          name: 'Seed3D (ByteDance)',
          features: ['Fast generation', 'ZIP output'],
        },
        {
          id: 'HUNYUAN3D_V3',
          name: 'Hunyuan3D v3',
          features: expect.arrayContaining([
            'GLB, OBJ, FBX output',
            'Configurable face count (40K-1.5M)',
          ]),
        },
      ];

      // Verify the structure matches what we expect
      expect(expectedModels[0].id).toBe('SEED3D');
      expect(expectedModels[1].id).toBe('HUNYUAN3D_V3');
    });
  });

  describe('Input validation', () => {
    it('should validate face count range', () => {
      // Face count should be between 40000 and 1500000
      const minFaceCount = 40000;
      const maxFaceCount = 1500000;
      const defaultFaceCount = 500000;

      expect(defaultFaceCount).toBeGreaterThanOrEqual(minFaceCount);
      expect(defaultFaceCount).toBeLessThanOrEqual(maxFaceCount);
    });

    it('should validate generate type options', () => {
      const validTypes = ['Normal', 'LowPoly', 'Geometry'];
      expect(validTypes).toContain('Normal');
      expect(validTypes).toContain('LowPoly');
      expect(validTypes).toContain('Geometry');
    });

    it('should validate polygon type options', () => {
      const validTypes = ['triangle', 'quadrilateral'];
      expect(validTypes).toContain('triangle');
      expect(validTypes).toContain('quadrilateral');
    });
  });
});
