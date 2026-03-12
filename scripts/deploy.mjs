import { spawn } from "node:child_process";

const target = process.argv[2];
const validTargets = new Set(["staging", "production"]);

if (!validTargets.has(target)) {
  console.error("Usage: node scripts/deploy.mjs <staging|production>");
  process.exit(1);
}

const envFile = `.env.${target}`;
const baseEnv = {
  ...process.env,
  NODE_ENV: target === "production" ? "production" : "development",
  DOTENV_CONFIG_PATH: envFile
};

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: true, env: baseEnv });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
    });
  });
}

async function main() {
  console.log(`Starting ${target} deployment using ${envFile}`);
  await run("npx", ["prisma", "generate"]);
  await run("npx", ["prisma", "migrate", "deploy"]);
  await run("npm", ["run", "build"]);
  console.log(`${target} deployment checks completed successfully`);
}

main().catch((error) => {
  console.error("Deployment failed", error);
  process.exit(1);
});
