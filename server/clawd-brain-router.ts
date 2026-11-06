import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { brainReply, brainStatus } from "./lib/clawd-brain";
import { listGatewayModels } from "./lib/neon-gateway";
export const clawdBrainRouter = router({
  status: publicProcedure.query(() => brainStatus()),
  models: protectedProcedure.query(async () => {
    try { return await listGatewayModels(); }
    catch (e) { throw new TRPCError({ code: "PRECONDITION_FAILED", message: (e as Error).message }); }
  }),
  chat: protectedProcedure.input(z.object({ provider: z.enum(["neon", "nvidia", "xai"]).default("neon"),
    prompt: z.string().trim().min(1).max(8000), model: z.string().min(1).max(160).optional() }))
    .mutation(async ({ input }) => {
      try { return await brainReply(input.provider, input.prompt, input.model); }
      catch (e) { throw new TRPCError({ code: "PRECONDITION_FAILED", message: (e as Error).message }); }
    }),
});
