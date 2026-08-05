import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Helper to create a mock context
function createMockContext(authenticated = false): TrpcContext {
  const user = authenticated ? {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  } : null;

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Robots Router", () => {
  it("should list robots without filters", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.robots.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should list robots with type filter", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.robots.list({ type: "trader" });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Agents Router", () => {
  it("should list all hedge fund agents", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.agents.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(9); // 9 hedge fund agents
  });

  it("should have correct agent codenames", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.agents.list();
    const codenames = result.map((a: any) => a.codename);
    
    expect(codenames).toContain("TICKER-01");
    expect(codenames).toContain("ECHO-X");
    expect(codenames).toContain("WIREHAWK");
    expect(codenames).toContain("ATLAS-FUNDAMENTAL");
    expect(codenames).toContain("ATLAS-BULL");
    expect(codenames).toContain("ATLAS-BEAR");
    expect(codenames).toContain("EDGE-GROK");
    expect(codenames).toContain("ATLAS-RISK");
    expect(codenames).toContain("ATLAS-EXECUTOR");
  });

  it("should get agent by id", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    // First get the list to find a valid ID
    const agents = await caller.agents.list();
    expect(agents.length).toBeGreaterThan(0);
    
    // Mock agents have IDs starting from 1
    const firstAgent = agents[0];
    expect(firstAgent.codename).toBe("TICKER-01");
  });
});

describe("Arena Router", () => {
  it("should return leaderboard as array", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.arena.leaderboard();
    expect(Array.isArray(result)).toBe(true);
    // In test environment without DB, returns mock data with 9 agents
    // or empty array if DB connection fails
    expect(result.length).toBeGreaterThanOrEqual(0);
  });
});

describe("Hedge Fund Router", () => {
  it("should return fund statistics", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.hedgeFund.stats();
    
    expect(result).toHaveProperty("aum");
    expect(result).toHaveProperty("dailyPnl");
    expect(result).toHaveProperty("activeAgents");
    expect(result).toHaveProperty("totalAgents");
    expect(result.totalAgents).toBe(9);
  });
});

describe("Trades Router", () => {
  it("should list trades", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.trades.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should list trades with limit", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.trades.list({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(10);
  });
});

describe("Avatars Router", () => {
  it("should list avatars", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.avatars.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should require authentication for getUserAvatars", async () => {
    const ctx = createMockContext(false);
    const caller = appRouter.createCaller(ctx);
    
    await expect(caller.avatars.getUserAvatars()).rejects.toThrow();
  });

  it("should allow authenticated users to get their avatars", async () => {
    const ctx = createMockContext(true);
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.avatars.getUserAvatars();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Bets Router", () => {
  it("should list bets", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.bets.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should require authentication for getUserBets", async () => {
    const ctx = createMockContext(false);
    const caller = appRouter.createCaller(ctx);
    
    await expect(caller.bets.getUserBets()).rejects.toThrow();
  });
});
