/**
 * postinstall: genera Prisma sin usar npx (más estable en Windows).
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

const isWin = process.platform === "win32";
const prismaCmd = isWin
  ? path.join(root, "node_modules", ".bin", "prisma.cmd")
  : path.join(root, "node_modules", ".bin", "prisma");

if (!fs.existsSync(prismaCmd)) {
  console.warn("postinstall: prisma aún no está instalado, se omite generate");
  process.exit(0);
}

const result = spawnSync(prismaCmd, ["generate"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
  },
});

process.exit(0);
