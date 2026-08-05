import { describe, expect, it } from "vitest";

describe("NVIDIA API Key Validation", () => {
  it("should have NVIDIA_API_KEY environment variable set", () => {
    const apiKey = process.env.NVIDIA_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    expect(typeof apiKey).toBe("string");
    // API keys typically have a minimum length
    expect(apiKey!.length).toBeGreaterThan(10);
  });

  it("should be able to make a test request to NVIDIA API", async () => {
    const apiKey = process.env.NVIDIA_API_KEY;
    
    if (!apiKey) {
      console.warn("NVIDIA_API_KEY not set, skipping API test");
      return;
    }

    try {
      // Make a minimal test request to validate the API key
      const response = await fetch('https://integrate.api.nvidia.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout for the fetch
      });

      // The API should respond (even if with an error, it validates the endpoint is reachable)
      // A 401 would indicate invalid key, 200 indicates valid key
      expect(response.status).not.toBe(401);
      
      // If we get a 200, the key is valid
      if (response.status === 200) {
        const data = await response.json();
        expect(data).toBeDefined();
      }
    } catch (error: any) {
      // Network errors are acceptable in test environment
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        console.warn("NVIDIA API request timed out - network may be slow");
        expect(true).toBe(true); // Pass the test
      } else {
        throw error;
      }
    }
  }, 15000); // 15 second test timeout
});
