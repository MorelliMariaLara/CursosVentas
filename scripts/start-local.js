/**
 * Arranque web local: SQLite + Next.js :8080 + Edge
 * Evita `npx` (rompe en Node 24 / Windows) y usa binarios locales.
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
  if (r.status !== 0) {
    fail(`Comando falló: ${cmd} ${args.join(" ")}`);
  }
}

function bin(name) {
  const unix = path.join(root, "node_modules", ".bin", name);
  const win = path.join(root, "node_modules", ".bin", `${name}.cmd`);
  if (isWin && fs.existsSync(win)) return win;
  if (fs.existsSync(unix)) return unix;
  return null;
}

function runLocal(name, args, extraEnv = {}) {
  const b = bin(name);
  if (!b) {
    fail(
      `No se encontró ${name} en node_modules.\n` +
        "Borrá la carpeta node_modules y volvé a ejecutar ABRIR.bat",
    );
  }
  run(b, args, extraEnv);
}

function ensureNode() {
  const v = spawnSync("node", ["-v"], { encoding: "utf8", shell: true });
  if (v.status !== 0) {
    fail("Instalá Node.js 20 LTS desde https://nodejs.org/ y reiniciá la PC.");
  }
  const version = String(v.stdout || "").trim();
  console.log("Node " + version);
  const major = Number((version.match(/^v(\d+)/) || [])[1] || 0);
  if (major >= 24) {
    console.log("");
    console.log("AVISO: Node " + major + " puede fallar con Prisma en Windows.");
    console.log("Si ves errores, instalá Node.js 20 LTS:");
    console.log("  https://nodejs.org/  (elegí la versión 20 LTS)");
    console.log("Luego reiniciá la PC, borrá node_modules y ejecutá ABRIR.bat");
    console.log("");
  }
  if (major > 0 && major < 18) {
    fail("Node es muy viejo. Instalá Node.js 20 LTS: https://nodejs.org/");
  }
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
  } else if (!bin("prisma") || !bin("tsx")) {
    log("Faltan herramientas. Reinstalando paquetes...");
    run("npm", ["install"]);
  } else {
    log("Paquetes OK");
  }
}

function ensureDb() {
  const env = { DATABASE_URL: "file:./dev.db" };
  log("Base de datos local...");
  runLocal("prisma", ["generate"], env);
  runLocal("prisma", ["db", "push", "--accept-data-loss"], env);
  runLocal("tsx", ["prisma/seed.ts"], env);
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
  log("Abriendo el sitio en Edge...");
  if (isWin) {
    spawn("cmd", ["/c", "start", "", "msedge", EDGE_URL], {
      detached: true,
      stdio: "ignore",
    }).unref();
    setTimeout(() => {
      spawn("cmd", ["/c", "start", "", EDGE_URL], {
        detached: true,
        stdio: "ignore",
      }).unref();
    }, 2500);
  }
}

async function main() {
  console.log("========================================");
  console.log("  SITIO WEB — Academia Certifica");
  console.log("  " + EDGE_URL);
  console.log("========================================");

  ensureNode();
  ensureEnv();
  ensureUploads();
  ensureDeps();
  ensureDb();

  console.log("\nAdmin: admin@academia.local");
  console.log("Clave: Admin123!");
  console.log("\nDejá esta ventana abierta mientras usás el sitio.\n");

  openBrowser();

  // Prefer local next binary over npx
  const nextBin = bin("next");
  const child = spawn(
    nextBin || "npx",
    nextBin
      ? ["dev", "-H", "127.0.0.1", "-p", PORT]
      : ["next", "dev", "-H", "127.0.0.1", "-p", PORT],
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
