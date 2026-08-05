import "dotenv/config";
import { OpenAI } from "openai";
import minimist from "minimist";
import { splash } from "./splash.js";
import { runRepl } from "./repl.js";

const argv = minimist(process.argv.slice(2));
const key = process.env.OPENROUTER_API_KEY;

if (!key) {
  console.error("Missing OPENROUTER_API_KEY in env.");
  process.exit(1);
}

const client = new OpenAI({
  apiKey: key,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.RALPH_SITE_URL || "http://localhost",
    "X-Title": process.env.RALPH_SITE_NAME || "ralph-terminal"
  }
});

const models = {
  fast: process.env.RALPH_MODEL_FAST || "openai/gpt-4o-mini",
  reason: process.env.RALPH_MODEL_REASON || "openai/gpt-4o",
  code: process.env.RALPH_MODEL_CODE || "anthropic/claude-3.5-sonnet"
};

if (argv.splash !== false) splash();

runRepl(client, models).catch(err => {
  console.error(err);
  process.exit(1);
});
