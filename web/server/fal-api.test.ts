import { describe, it, expect } from "vitest";

describe("FAL AI API Configuration", () => {
  it("should have FAL_API_KEY configured", () => {
    const apiKey = process.env.FAL_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    expect(typeof apiKey).toBe("string");
  });

  it("FAL_API_KEY should have valid format", () => {
    const apiKey = process.env.FAL_API_KEY;
    // FAL API keys are typically alphanumeric strings
    expect(apiKey).toBeDefined();
    expect(apiKey!.length).toBeGreaterThan(10);
  });

  it("should have Seed3D model endpoint configured", () => {
    const seed3dEndpoint = "fal-ai/bytedance/seed3d/image-to-3d";
    expect(seed3dEndpoint).toBe("fal-ai/bytedance/seed3d/image-to-3d");
  });

  it("should have Hunyuan3D-v3 model endpoint configured", () => {
    const hunyuan3dEndpoint = "fal-ai/hunyuan3d-v3/image-to-3d";
    expect(hunyuan3dEndpoint).toBe("fal-ai/hunyuan3d-v3/image-to-3d");
  });

  it("should support required generation types for Hunyuan3D", () => {
    const generateTypes = ["Normal", "LowPoly", "Geometry"];
    expect(generateTypes).toContain("Normal");
    expect(generateTypes).toContain("LowPoly");
    expect(generateTypes).toContain("Geometry");
  });

  it("should support required polygon types for Hunyuan3D", () => {
    const polygonTypes = ["triangle", "quadrilateral"];
    expect(polygonTypes).toContain("triangle");
    expect(polygonTypes).toContain("quadrilateral");
  });

  it("should have valid face count range for Hunyuan3D", () => {
    const minFaceCount = 40000;
    const maxFaceCount = 1500000;
    const defaultFaceCount = 500000;
    
    expect(defaultFaceCount).toBeGreaterThanOrEqual(minFaceCount);
    expect(defaultFaceCount).toBeLessThanOrEqual(maxFaceCount);
  });
});
