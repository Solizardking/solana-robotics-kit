import chalk from "chalk";

export function splash() {
  const title = `
${chalk.bold.magenta("██████╗  █████╗ ██╗     ██████╗ ██╗  ██╗")}
${chalk.bold.magenta("██╔══██╗██╔══██╗██║     ██╔══██╗██║  ██║")}
${chalk.bold.magenta("██████╔╝███████║██║     ██████╔╝███████║")}
${chalk.bold.magenta("██╔══██╗██╔══██║██║     ██╔═══╝ ██╔══██║")}
${chalk.bold.magenta("██║  ██║██║  ██║███████╗██║     ██║  ██║")}
${chalk.bold.magenta("╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝  ╚═╝")}
`;

  const sub = chalk.gray(
    "Solana Ralph Operator • OpenRouter Routing • Recursive Terminal Agent\n" +
    "Type /help for commands • Type /exit to quit\n"
  );

  // "Claude Code" nod (original ASCII text, not a copy)
  const nod = chalk.cyan(`
   ______ _                 _        _____          _      
  / ____| |               | |      / ____|        | |     
 | |    | | __ _ _   _  __| | ___ | |     ___   __| | ___ 
 | |    | |/ _\` | | | |/ _\` |/ _ \\| |    / _ \\ / _\` |/ _ \\
 | |____| | (_| | |_| | (_| |  __/| |___| (_) | (_| |  __/
  \\_____|_|\\__,_|\\__,_|\\__,_|\\___| \\_____\\___/ \\__,_|\\___|
`);

  console.log(title);
  console.log(nod);
  console.log(sub);
}
