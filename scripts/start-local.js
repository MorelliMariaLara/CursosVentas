/**
 * Arranque simple: SQLite + http://localhost:8080 + Edge
 * Un solo doble clic desde ABRIR.bat
 */
const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");
const http = require("http");

const root = process.cwd();
const isWin = process.platform === "win32";
const PORT = "8080";
const URL = `http://localhost:${PORT}`;

function log(m) {
  console.log(`\n==> ${m}`);
}
function fail(m) {
  console.error(`\nERROR: ${m}`);
  if (isWin) spawnSync("pause", { shell: true, stdio: "inherit" });
  process.exit(1);
}
function run(cmd, args, env = {}) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env },
  });
  if (r.status !== 0) fail(`Falló: ${cmd} ${args.join(" ")}`);
}

function ensureEnv() {
  const envPath = path.join(root, ".env");
  const content = [
    'DATABASE_URL="file:./dev.db"',
    'AUTH_SECRET="dev-secret-change-me-in-production-32chars"',
    `NEXTAUTH_URL="${URL}"`,
    `APP_URL="${URL}"`,
    "PORT=8080",
    'APP_NAME="Academia Certifica"',
    'UPLOAD_DIR="./uploads"',
    'ADMIN_EMAIL="admin@academia.local"',
    'ADMIN_PASSWORD="Admin123!"',
    'ADMIN_NAME="Administrador"',
    'MP_ACCESS_TOKEN=""',
    'MP_PUBLIC_KEY=""',
    "",
  ].join("\n");
  fs.writeFileSync(envPath, content);
  log(".env listo (SQLite local)");
}

function ensureUploads() {
  for (const d of [
    "uploads",
    "uploads/videos",
    "uploads/thumbnails",
    "uploads/certificates",
  ]) {
    fs.mkdirSync(path.join(root, d), { recursive: true });
  }
}

function ensureDeps() {
  if (!fs.existsSync(path.join(root, "node_modules", "next"))) {
    log("Instalando dependencias (solo la primera vez)...");
    run("npm", ["install"]);
  }
}

function ensureDb() {
  const env = { DATABASE_URL: "file:./dev.db" };
  log("Preparando base local...");
  run("npx", ["prisma", "generate"], env);
  run("npx", ["prisma", "db", "push", "--accept-data-loss"], env);
  run("npx", ["tsx", "prisma/seed.ts"], env);
}

function waitReady() {
  return new Promise((resolve) => {
    let n = 60;
    const tick = () => {
      http
        .get(URL, (res) => {
          res.resume();
          resolve(true);
        })
        .on("error", () => {
          if (--n <= 0) return resolve(false);
          setTimeout(tick, 500);
        });
    };
    tick();
  });
}

async function openEdge() {
  const ok = await waitReady();
  if (!ok) {
    console.warn("Abrí manualmente " + URL);
    return;
  }
  log("Abriendo Microsoft Edge...");
  if (isWin) {
    spawn("cmd", ["/c", "start", "", "msedge", URL], {
      detached: true,
      stdio: "ignore",
    }).unref();
  }
}

async function main() {
  console.log("====================================");
  console.log("  Academia Certifica");
  console.log("  " + URL);
  console.log("====================================");

  const node = spawnSync("node", ["-v"], { encoding: "utf8", shell: true });
  if (node.status !== 0) {
    fail("Instalá Node.js LTS desde https://nodejs.org/ y reiniciá la PC.");
  }
  console.log("Node " + String(node.stdout).trim());

  ensureEnv();
  ensureUploads();
  ensureDeps();
  ensureDb();

  log("Servidor iniciando...");
  console.log("Admin: admin@academia.local / Admin123!");
  console.log("NO CIERRES esta ventana.\n");

  openEdge();

  const child = spawn("npx", ["next", "dev", "-H", "127.0.0.1", "-p", PORT], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      DATABASE_URL: "file:./dev.db",
      PORT,
      NEXTAUTH_URL: URL,
      APP_URL: URL,
    },
  });
  child.on("exit", (c) => process.exit(c ?? 0));
}

main().catch((e) => fail(String(e)));
