import "../server/_core/load-env";
import { listGatewayModels, gatewayReply } from "../server/lib/neon-gateway";
try {
  const models = await listGatewayModels();
  console.table(models.map(({ id, enabled }) => ({ id, enabled })));
  const result = await gatewayReply("Introduce yourself as CLAWD, a Solana robotics assistant, in one short sentence. Do not claim you control a robot.");
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  console.error((e as Error).message);
  process.exitCode = 1;
}
