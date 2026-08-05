import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthenticatedContext(): TrpcContext {
  return {
    user: {
      id: "test-user-id",
      openId: "test-open-id",
      name: "Test User",
      email: "test@example.com",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("3D Model Upload System", () => {
  describe("models.list", () => {
    it("returns array of models for authenticated users", async () => {
      const ctx = createAuthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.models.list({ publicOnly: true });

      expect(Array.isArray(result)).toBe(true);
    });

    it("returns models with correct structure when models exist", async () => {
      const ctx = createAuthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.models.list({});

      expect(Array.isArray(result)).toBe(true);
      
      // If there are models, check structure
      if (result.length > 0) {
        const model = result[0];
        expect(model).toHaveProperty("id");
        expect(model).toHaveProperty("name");
        expect(model).toHaveProperty("fileUrl");
        expect(model).toHaveProperty("fileType");
        expect(model).toHaveProperty("isPublic");
      }
    });
  });

  describe("models.getById", () => {
    it("throws error for non-existent model", async () => {
      const ctx = createAuthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      // Expect the call to throw an error for non-existent model
      await expect(caller.models.getById({ id: 999999 })).rejects.toThrow();
    });
  });

  describe("Supabase Storage Integration", () => {
    it("storage module exports required functions", async () => {
      const storage = await import("./supabase-storage");
      
      expect(typeof storage.uploadModel).toBe("function");
      expect(typeof storage.deleteModel).toBe("function");
      expect(typeof storage.getSignedUrl).toBe("function");
      expect(typeof storage.isValidModelFile).toBe("function");
    });

    it("isValidModelFile validates file extensions correctly", async () => {
      const { isValidModelFile } = await import("./supabase-storage");
      
      // Valid extensions
      expect(isValidModelFile("model.glb")).toBe(true);
      expect(isValidModelFile("model.gltf")).toBe(true);
      expect(isValidModelFile("model.vrm")).toBe(true);
      expect(isValidModelFile("model.fbx")).toBe(true);
      expect(isValidModelFile("model.obj")).toBe(true);
      
      // Invalid extensions
      expect(isValidModelFile("model.txt")).toBe(false);
      expect(isValidModelFile("model.png")).toBe(false);
      expect(isValidModelFile("model.mp4")).toBe(false);
    });

    it("getFileExtension extracts extension correctly", async () => {
      const { getFileExtension } = await import("./supabase-storage");
      
      expect(getFileExtension("model.glb")).toBe(".glb");
      expect(getFileExtension("my-robot.vrm")).toBe(".vrm");
      expect(getFileExtension("test.file.gltf")).toBe(".gltf");
    });
  });

  describe("Supported File Types", () => {
    it("defines correct supported extensions", async () => {
      const { SUPPORTED_EXTENSIONS } = await import("./supabase-storage");
      
      expect(SUPPORTED_EXTENSIONS).toContain(".glb");
      expect(SUPPORTED_EXTENSIONS).toContain(".gltf");
      expect(SUPPORTED_EXTENSIONS).toContain(".vrm");
      expect(SUPPORTED_EXTENSIONS).toContain(".fbx");
      expect(SUPPORTED_EXTENSIONS).toContain(".obj");
    });

    it("defines correct max file size (50MB)", async () => {
      const { MAX_FILE_SIZE } = await import("./supabase-storage");
      
      expect(MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
    });
  });
});
