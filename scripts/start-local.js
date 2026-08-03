/**
 * Arranque local con SQL Server Express.
 * Servidor: LARA-NB\SQLEXPRESS02
 * Base:     Cursosventas
 */
const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");
const http = require("http");

const root = process.cwd();
const isWin = process.platform === "win32";

const DEFAULT_SQLSERVER_URL =
  'sqlserver://LARA-NB\\SQLEXPRESS02;database=Cursosventas;integratedSecurity=true;trustServerCertificate=true';

function log(msg) {
  console.log(`\n==> ${msg}`);
}

function fail(msg) {
  console.error(`\nERROR: ${msg}`);
  if (isWin) {
    console.log("\nPresioná una tecla para cerrar...");
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
    fail(`Falló: ${command} ${args.join(" ")}\nRevisá que SQL Server esté corriendo y la base Cursosventas exista.`);
  }
}

function ensureNode() {
  const v = spawnSync("node", ["-v"], { encoding: "utf8", shell: true });
  if (v.status !== 0) {
    fail(
      "Node.js no está instalado o no está en el PATH.\nInstalá LTS desde https://nodejs.org/ y reiniciá la PC.",
    );
  }
  console.log(`Node ${String(v.stdout || "").trim()}`);
}

function ensureEnv() {
  const envPath = path.join(root, ".env");
  const examplePath = path.join(root, ".env.example");

  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
      log("Se creó .env desde .env.example");
    } else {
      fail("No existe .env ni .env.example");
    }
  }

  let content = fs.readFileSync(envPath, "utf8");

  // Si todavía tiene SQLite, o no tiene DATABASE_URL, poner SQL Server
  const current = content.match(/^DATABASE_URL=(.*)$/m);
  const value = current ? current[1] : "";
  const isSqlite = value.includes("file:") || value.includes("dev.db");
  if (!current || isSqlite || value.trim() === '""' || value.trim() === "") {
    content = content.replace(/^DATABASE_URL=.*$/m, "");
    content =
      `DATABASE_URL="${DEFAULT_SQLSERVER_URL}"\n` + content.trim() + "\n";
    log("DATABASE_URL configurado a SQL Server (Cursosventas)");
  }

  if (!/^AUTH_SECRET=/m.test(content)) {
    content +=
      '\nAUTH_SECRET="dev-secret-change-me-in-production-32chars"\n';
  }
  if (!/^NEXTAUTH_URL=/m.test(content)) {
    content += '\nNEXTAUTH_URL="http://localhost:3000"\n';
  }
  if (!/^APP_URL=/m.test(content)) {
    content += '\nAPP_URL="http://localhost:3000"\n';
  }

  fs.writeFileSync(envPath, content);

  const urlLine = content.match(/^DATABASE_URL=(.*)$/m);
  console.log(`Usando ${urlLine ? urlLine[1] : "(sin URL)"}`);
}

function readDatabaseUrl() {
  const envPath = path.join(root, ".env");
  const content = fs.readFileSync(envPath, "utf8");
  const m = content.match(/^DATABASE_URL="?(.*?)"?\s*$/m);
  if (!m) fail("No se encontró DATABASE_URL en .env");
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
  if (!fs.existsSync(path.join(root, "node_modules"))) {
    log("Instalando dependencias (npm install)...");
    run("npm", ["install"]);
  } else {
    log("Dependencias OK");
  }
}

function ensureDatabase() {
  const databaseUrl = readDatabaseUrl();
  const env = { DATABASE_URL: databaseUrl };

  log("Generando Prisma Client (SQL Server)...");
  run("npx", ["prisma", "generate"], { env });

  log("Sincronizando tablas en SQL Server (prisma db push)...");
  console.log(
    "Si falla la conexión: habilitá TCP/IP en SQL Server Configuration Manager",
  );
  console.log("y asegurate de que exista la base Cursosventas.\n");
  run("npx", ["prisma", "db", "push", "--accept-data-loss"], { env });

  log("Seed admin + curso demo...");
  run("npx", ["tsx", "prisma/seed.ts"], { env });
}

function waitForServer(url, attempts = 40) {
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
  const ok = await waitForServer("http://localhost:3000");
  if (!ok) {
    console.warn("Abrí manualmente http://localhost:3000");
    return;
  }
  log("Abriendo Microsoft Edge...");
  if (isWin) {
    spawn("cmd", ["/c", "start", "msedge", "http://localhost:3000"], {
      detached: true,
      stdio: "ignore",
    }).unref();
  }
}

async function main() {
  console.log("========================================");
  console.log("  CursosVentas + SQL Server Express");
  console.log("  LARA-NB\\SQLEXPRESS02 / Cursosventas");
  console.log("========================================");

  ensureNode();
  ensureEnv();
  ensureUploads();
  ensureDeps();
  ensureDatabase();

  const databaseUrl = readDatabaseUrl();

  log("Iniciando http://localhost:3000");
  console.log("Admin: admin@academia.local / Admin123!");
  console.log("Dejá esta ventana ABIERTA.\n");

  openBrowser();

  const child = spawn("npx", ["next", "dev", "-p", "3000"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => fail(String(err && err.message ? err.message : err)));
