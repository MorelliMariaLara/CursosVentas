/**
 * Arranque web local: SQLite + Next.js :8080 + Edge
 */
const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");
const http = require("http");

const root = process.cwd();
const isWin = process.platform === "win32";
const PORT = "8080";
const URL = `http://127.0.0.1:${PORT}`;
const EDGE_URL = `http://localhost:${PORT}`;

function log(m) {
  console.log(`\n==> ${m}`);
}
function fail(m) {
  console.error(`\nERROR: ${m}`);
  if (isWin) spawnSync("pause", { shell: true, stdio: "inherit" });
  process.exit(1);
}
function run(cmd, args, extraEnv = {}) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...extraEnv },
  });
  if (r.status !== 0) fail(`Comando falló: ${cmd} ${args.join(" ")}`);
}

function ensureEnv() {
  const envPath = path.join(root, ".env");
  fs.writeFileSync(
    envPath,
    [
      'DATABASE_URL="file:./dev.db"',
      'AUTH_SECRET="dev-secret-change-me-in-production-32chars"',
      `NEXTAUTH_URL="${EDGE_URL}"`,
      `APP_URL="${EDGE_URL}"`,
      `PORT=${PORT}`,
      'APP_NAME="Academia Certifica"',
      'UPLOAD_DIR="./uploads"',
      'ADMIN_EMAIL="admin@academia.local"',
      'ADMIN_PASSWORD="Admin123!"',
      'ADMIN_NAME="Administrador"',
      'MP_ACCESS_TOKEN=""',
      'MP_PUBLIC_KEY=""',
      "",
    ].join("\n"),
  );
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
    log("Instalando paquetes web (npm install)...");
    run("npm", ["install"]);
  } else {
    log("Paquetes OK");
  }
}

function ensureDb() {
  const env = { DATABASE_URL: "file:./dev.db" };
  log("Base de datos local...");
  run("npx", ["prisma", "generate"], env);
  run("npx", ["prisma", "db", "push", "--accept-data-loss"], env);
  run("npx", ["tsx", "prisma/seed.ts"], env);
}

function waitReady() {
  return new Promise((resolve) => {
    let left = 90;
    const tick = () => {
      http
        .get(URL, (res) => {
          res.resume();
          resolve(true);
        })
        .on("error", () => {
          if (--left <= 0) return resolve(false);
          setTimeout(tick, 500);
        });
    };
    setTimeout(tick, 1500);
  });
}

async function openBrowser() {
  const ok = await waitReady();
  if (!ok) {
    console.warn("\nAbrí el navegador en: " + EDGE_URL);
    return;
  }
  log("Abriendo el sitio en el navegador...");
  if (isWin) {
    // Edge primero; si no está, el navegador por defecto
    spawn("cmd", ["/c", "start", "", "msedge", EDGE_URL], {
      detached: true,
      stdio: "ignore",
    }).unref();
    setTimeout(() => {
      spawn("cmd", ["/c", "start", "", EDGE_URL], {
        detached: true,
        stdio: "ignore",
      }).unref();
    }, 2000);
  }
}

async function main() {
  console.log("========================================");
  console.log("  SITIO WEB — Academia Certifica");
  console.log("  " + EDGE_URL);
  console.log("========================================");

  const v = spawnSync("node", ["-v"], { encoding: "utf8", shell: true });
  if (v.status !== 0) {
    fail("Instalá Node.js LTS: https://nodejs.org/");
  }
  console.log("Node " + String(v.stdout).trim());

  ensureEnv();
  ensureUploads();
  ensureDeps();
  ensureDb();

  console.log("\nAdmin: admin@academia.local");
  console.log("Clave: Admin123!");
  console.log("\nDejá esta ventana abierta mientras usás el sitio.\n");

  openBrowser();

  const child = spawn(
    "npx",
    ["next", "dev", "-H", "127.0.0.1", "-p", PORT],
    {
      cwd: root,
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        DATABASE_URL: "file:./dev.db",
        PORT,
        NEXTAUTH_URL: EDGE_URL,
        APP_URL: EDGE_URL,
      },
    },
  );
  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((e) => fail(String(e && e.message ? e.message : e)));
