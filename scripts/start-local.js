/**
 * Arranque web local: SQLite + Next.js :8080 + Edge
 * Evita `npx` (rompe en Node 24 / Windows) y usa binarios locales.
 */
const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");
const http = require("http");
const os = require("os");

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

/** Env for child processes: never omit devDependencies during local setup. */
function childEnv(extra = {}) {
  const env = { ...process.env, ...extra };
  // NODE_ENV=production haría que npm omita prisma/tsx (devDependencies)
  if (String(env.NODE_ENV || "").toLowerCase() === "production") {
    delete env.NODE_ENV;
  }
  return env;
}

function run(cmd, args, extraEnv = {}) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: childEnv(extraEnv),
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

/** Resolve a real system npm (not the old NuGet .bin\\npm.cmd). */
function resolveNpm() {
  if (isWin) {
    const candidates = [
      path.join(process.env.ProgramFiles || "C:\\Program Files", "nodejs", "npm.cmd"),
      path.join(process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "nodejs", "npm.cmd"),
      path.join(process.env.LOCALAPPDATA || "", "Programs", "nodejs", "npm.cmd"),
    ];
    for (const c of candidates) {
      if (c && fs.existsSync(c)) return `"${c}"`;
    }
  }

  const which = spawnSync(isWin ? "where" : "which", ["npm"], {
    encoding: "utf8",
    shell: true,
    env: childEnv(),
  });
  const lines = String(which.stdout || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const line of lines) {
    const lower = line.toLowerCase();
    // Skip ancient NuGet wrappers committed/restored under .bin or packages/
    if (lower.includes(`${path.sep}.bin${path.sep}`) || lower.includes(`${path.sep}packages${path.sep}`)) {
      continue;
    }
    if (lower.includes("nodejs") || lower.endsWith("npm.cmd") || lower.endsWith("npm")) {
      return isWin ? `"${line}"` : line;
    }
  }

  return lines[0] ? (isWin ? `"${lines[0]}"` : lines[0]) : "npm";
}

function showNpmLogHint() {
  try {
    const base = isWin
      ? path.join(process.env.LOCALAPPDATA || "", "npm-cache", "_logs")
      : path.join(os.homedir(), ".npm", "_logs");
    if (!base || !fs.existsSync(base)) return;
    const logs = fs
      .readdirSync(base)
      .filter((f) => f.endsWith(".log"))
      .map((f) => ({ f, t: fs.statSync(path.join(base, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    if (!logs.length) return;
    const latest = path.join(base, logs[0].f);
    const text = fs.readFileSync(latest, "utf8");
    const lines = text.split(/\r?\n/).filter(Boolean);
    const tail = lines.slice(-40).join("\n");
    console.error("\n--- Últimas líneas del log de npm ---");
    console.error(tail);
    console.error("--- fin log ---\n");
    console.error("Log completo: " + latest);
  } catch {
    /* ignore */
  }
}

function npmInstall() {
  const npm = resolveNpm();
  log("Instalando paquetes (npm install --include=dev)...");
  console.log("Usando: " + npm);

  const r = spawnSync(npm, ["install", "--include=dev", "--no-fund", "--no-audit"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: childEnv({
      // Fuerza que se instalen prisma/tsx aunque el entorno diga production
      NPM_CONFIG_PRODUCTION: "false",
      npm_config_production: "false",
    }),
  });

  if (r.status !== 0) {
    showNpmLogHint();
    fail(
      "npm install falló.\n" +
        "1) Cerrá Visual Studio\n" +
        "2) Borrá la carpeta node_modules (si existe)\n" +
        "3) Abrí una terminal en esta carpeta y ejecutá: npm install\n" +
        "4) Volvé a ejecutar ABRIR.bat o F5",
    );
  }
}

function rimraf(target) {
  fs.rmSync(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
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

function warnLegacyNugetTools() {
  const legacyNpm = path.join(root, ".bin", "npm.cmd");
  const legacyNode = path.join(root, "packages", "Node.js.0.12.7", "node.exe");
  if (fs.existsSync(legacyNpm) || fs.existsSync(legacyNode)) {
    console.log("");
    console.log("AVISO: se detectaron herramientas viejas de NuGet (.bin / packages).");
    console.log("Pueden romper npm install. Se ignoran; preferí Node del sistema.");
    console.log("Si el error vuelve, borrá las carpetas .bin y packages de este proyecto.");
    console.log("");
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

function depsOk() {
  return (
    fs.existsSync(path.join(root, "node_modules", "next")) &&
    !!bin("prisma") &&
    !!bin("tsx") &&
    !!bin("next")
  );
}

function ensureDeps() {
  if (depsOk()) {
    log("Paquetes OK");
    return;
  }

  const nm = path.join(root, "node_modules");
  if (fs.existsSync(nm)) {
    log("node_modules incompleto (faltan prisma/tsx). Reinstalando limpio...");
    try {
      rimraf(nm);
    } catch (e) {
      fail(
        "No se pudo borrar node_modules (¿archivo en uso?).\n" +
          "Cerrá Visual Studio y cualquier terminal, borrá node_modules a mano y reintentá.\n" +
          String(e && e.message ? e.message : e),
      );
    }
  } else {
    log("Instalando paquetes web...");
  }

  npmInstall();

  if (!depsOk()) {
    fail(
      "Después de npm install siguen faltando herramientas (next/prisma/tsx).\n" +
        "Ejecutá en esta carpeta:\n" +
        "  rmdir /s /q node_modules\n" +
        "  npm install\n" +
        "y volvé a abrir con ABRIR.bat",
    );
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
  warnLegacyNugetTools();
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
      env: childEnv({
        DATABASE_URL: "file:./dev.db",
        PORT,
        NEXTAUTH_URL: EDGE_URL,
        APP_URL: EDGE_URL,
      }),
    },
  );
  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((e) => fail(String(e && e.message ? e.message : e)));
