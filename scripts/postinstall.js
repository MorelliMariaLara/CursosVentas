/**
 * Asegura .env y genera Prisma Client tras npm install.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = process.cwd();
const envPath = path.join(root, ".env");
const examplePath = path.join(root, ".env.example");

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
  } else {
    fs.writeFileSync(
      envPath,
      'DATABASE_URL="file:./dev.db"\nAUTH_SECRET="dev-secret"\nNEXTAUTH_URL="http://localhost:8080"\nAPP_URL="http://localhost:8080"\n',
    );
  }
}

const result = spawnSync("npx", ["prisma", "generate"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
  },
});

process.exit(result.status === 0 ? 0 : 0);
