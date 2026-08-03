/**
 * Asegura .env local y genera el cliente de Prisma.
 * Evita que `npm install` falle en Windows si todavía no existe .env.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = process.cwd();
const envPath = path.join(root, ".env");
const examplePath = path.join(root, ".env.example");

if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log("Se creó .env desde .env.example");
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

if (result.status !== 0) {
  console.warn(
    "Aviso: prisma generate no completó. Después de npm install corré: npx prisma generate",
  );
  // No abortamos npm install por esto
  process.exit(0);
}
