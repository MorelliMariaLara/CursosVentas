/**
 * Arranque local — SQL Server + puerto 8080
 * Servidor: LARA-NB\SQLEXPRESS02
 * Base:     Cursosventas
 * URL:      http://localhost:8080
 */
const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");
const http = require("http");

const root = process.cwd();
const isWin = process.platform === "win32";
const PORT = process.env.PORT || "8080";
const APP_LOCAL_URL = `http://localhost:${PORT}`;

const DEFAULT_SQLSERVER_URL =
  "sqlserver://LARA-NB\\SQLEXPRESS02;database=Cursosventas;integratedSecurity=true;trustServerCertificate=true";

function log(msg) {
  console.log(`\n==> ${msg}`);
}

function fail(msg) {
  console.error(`\nERROR: ${msg}`);
  if (isWin) {
    console.log("\nPresioná Enter para cerrar...");
    try {
      spawnSync("pause", { shell: true, stdio: "inherit" });
    } catch {
      /* ignore */
    }
  }
  process.exit(1);
}

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...opts.env },
  });
  if (result.status !== 0) {
    fail(
      `Falló: ${command} ${args.join(" ")}\n` +
        "Revisá que SQL Server (SQLEXPRESS02) esté corriendo y exista la base Cursosventas.",
    );
  }
}

function ensureNode() {
  const v = spawnSync("node", ["-v"], { encoding: "utf8", shell: true });
  if (v.status !== 0) {
    fail(
      "Node.js no está en el PATH.\nInstalá LTS desde https://nodejs.org/ y reiniciá la PC.",
    );
  }
  console.log(`Node ${String(v.stdout || "").trim()}`);
}

function ensureEnv() {
  const envPath = path.join(root, ".env");
  const examplePath = path.join(root, ".env.example");

  if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    log("Se creó .env desde .env.example");
  }

  if (!fs.existsSync(envPath)) {
    fail("No existe .env");
  }

  let content = fs.readFileSync(envPath, "utf8");

  // Forzar SQL Server (si había SQLite u otra URL inválida)
  const urlMatch = content.match(/^DATABASE_URL=(.*)$/m);
  const raw = urlMatch ? urlMatch[1] : "";
  const needsSql =
    !urlMatch ||
    raw.includes("file:") ||
    raw.includes("dev.db") ||
    raw.trim() === '""' ||
    raw.trim() === "";

  if (needsSql) {
    content = content.replace(/^DATABASE_URL=.*$/m, "");
    content =
      `DATABASE_URL="${DEFAULT_SQLSERVER_URL}"\n` + content.trim() + "\n";
    log("DATABASE_URL -> SQL Server Cursosventas");
  }

  // Puerto 8080
  content = content.replace(/^NEXTAUTH_URL=.*$/m, `NEXTAUTH_URL="${APP_LOCAL_URL}"`);
  content = content.replace(/^APP_URL=.*$/m, `APP_URL="${APP_LOCAL_URL}"`);
  if (!/^NEXTAUTH_URL=/m.test(content)) {
    content += `\nNEXTAUTH_URL="${APP_LOCAL_URL}"\n`;
  }
  if (!/^APP_URL=/m.test(content)) {
    content += `\nAPP_URL="${APP_LOCAL_URL}"\n`;
  }
  if (!/^AUTH_SECRET=/m.test(content)) {
    content +=
      '\nAUTH_SECRET="dev-secret-change-me-in-production-32chars"\n';
  }
  if (!/^PORT=/m.test(content)) {
    content += `\nPORT=${PORT}\n`;
  } else {
    content = content.replace(/^PORT=.*$/m, `PORT=${PORT}`);
  }

  fs.writeFileSync(envPath, content);
  const shown = content.match(/^DATABASE_URL=(.*)$/m);
  console.log(`DB: ${shown ? shown[1] : "?"}`);
  console.log(`URL: ${APP_LOCAL_URL}`);
}

function readDatabaseUrl() {
  const content = fs.readFileSync(path.join(root, ".env"), "utf8");
  const m = content.match(/^DATABASE_URL="?(.*?)"?\s*$/m);
  if (!m) fail("No hay DATABASE_URL en .env");
  return m[1];
}

function ensureUploads() {
  for (const dir of [
    "uploads",
    "uploads/videos",
    "uploads/thumbnails",
    "uploads/certificates",
  ]) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
}

function ensureDeps() {
  if (!fs.existsSync(path.join(root, "node_modules", "next"))) {
    log("npm install (puede tardar)...");
    run("npm", ["install"]);
  } else {
    log("Dependencias OK");
  }
}

function ensureDatabase() {
  const databaseUrl = readDatabaseUrl();
  const env = { DATABASE_URL: databaseUrl };

  log("Prisma generate...");
  run("npx", ["prisma", "generate"], { env });

  log("Sincronizando tablas en SQL Server...");
  run("npx", ["prisma", "db", "push", "--accept-data-loss"], { env });

  log("Seed admin + curso demo...");
  run("npx", ["tsx", "prisma/seed.ts"], { env });
}

function waitForServer(url, attempts = 60) {
  return new Promise((resolve) => {
    let left = attempts;
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(true);
      });
      req.on("error", () => {
        left -= 1;
        if (left <= 0) return resolve(false);
        setTimeout(tick, 500);
      });
    };
    tick();
  });
}

async function openBrowser() {
  const ok = await waitForServer(APP_LOCAL_URL);
  if (!ok) {
    console.warn(`No respondió a tiempo. Abrí manualmente ${APP_LOCAL_URL}`);
    return;
  }
  log(`Abriendo Edge -> ${APP_LOCAL_URL}`);
  if (isWin) {
    spawn("cmd", ["/c", "start", "msedge", APP_LOCAL_URL], {
      detached: true,
      stdio: "ignore",
    }).unref();
  }
}

async function main() {
  console.log("========================================");
  console.log("  CursosVentas + SQL Server");
  console.log(`  Puerto ${PORT}  |  ${APP_LOCAL_URL}`);
  console.log("  LARA-NB\\SQLEXPRESS02 / Cursosventas");
  console.log("========================================");

  ensureNode();
  ensureEnv();
  ensureUploads();
  ensureDeps();
  ensureDatabase();

  const databaseUrl = readDatabaseUrl();

  log(`Iniciando servidor en ${APP_LOCAL_URL}`);
  console.log("Admin: admin@academia.local / Admin123!");
  console.log("NO CIERRES esta ventana.\n");

  openBrowser();

  const child = spawn(
    "npx",
    ["next", "dev", "-H", "127.0.0.1", "-p", String(PORT)],
    {
      cwd: root,
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        PORT: String(PORT),
        NEXTAUTH_URL: APP_LOCAL_URL,
        APP_URL: APP_LOCAL_URL,
      },
    },
  );

  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => fail(String(err && err.message ? err.message : err)));
