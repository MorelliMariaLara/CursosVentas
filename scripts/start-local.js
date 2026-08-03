/**
 * Arranque local a prueba de balas (Windows / Mac / Linux).
 * - Crea .env si falta
 * - Fuerza SQLite local (file:./dev.db) para que siempre arranque
 * - npm install si no hay node_modules
 * - prisma generate + db push + seed
 * - next dev
 * - en Windows abre Edge
 */
const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");
const http = require("http");

const root = process.cwd();
const isWin = process.platform === "win32";

function log(msg) {
  console.log(`\n==> ${msg}`);
}

function fail(msg, code = 1) {
  console.error(`\nERROR: ${msg}`);
  if (isWin) {
    console.log("\nPresioná una tecla para cerrar...");
    try {
      spawnSync("pause", { shell: true, stdio: "inherit" });
    } catch {
      /* ignore */
    }
  }
  process.exit(code);
}

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...opts.env },
  });
  if (result.status !== 0) {
    fail(`Falló: ${command} ${args.join(" ")}`);
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
      fs.writeFileSync(
        envPath,
        [
          'DATABASE_URL="file:./dev.db"',
          'AUTH_SECRET="dev-secret-change-me-in-production-32chars"',
          'NEXTAUTH_URL="http://localhost:3000"',
          'APP_NAME="Academia Certifica"',
          'APP_URL="http://localhost:3000"',
          'UPLOAD_DIR="./uploads"',
          'ADMIN_EMAIL="admin@academia.local"',
          'ADMIN_PASSWORD="Admin123!"',
          'ADMIN_NAME="Administrador"',
          "",
        ].join("\n"),
      );
      log("Se creó .env mínimo");
    }
  }

  // Forzar SQLite local para arranque garantizado
  let content = fs.readFileSync(envPath, "utf8");
  if (/^DATABASE_URL=.*/m.test(content)) {
    content = content.replace(
      /^DATABASE_URL=.*/m,
      'DATABASE_URL="file:./dev.db"',
    );
  } else {
    content = `DATABASE_URL="file:./dev.db"\n` + content;
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
  log('DATABASE_URL local = file:./dev.db (SQLite)');
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
    log("Dependencias OK (node_modules existe)");
  }
}

function ensureDatabase() {
  const env = {
    DATABASE_URL: "file:./dev.db",
  };
  log("Generando Prisma Client...");
  run("npx", ["prisma", "generate"], { env });
  log("Creando / actualizando tablas SQLite...");
  run("npx", ["prisma", "db", "push", "--accept-data-loss"], { env });
  log("Cargando admin + curso demo...");
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
    console.warn(
      "El servidor tarda en responder. Abrí manualmente http://localhost:3000",
    );
    return;
  }
  log("Abriendo navegador...");
  if (isWin) {
    spawn("cmd", ["/c", "start", "msedge", "http://localhost:3000"], {
      detached: true,
      stdio: "ignore",
      shell: false,
    }).unref();
  } else {
    const opener = process.platform === "darwin" ? "open" : "xdg-open";
    spawn(opener, ["http://localhost:3000"], {
      detached: true,
      stdio: "ignore",
    }).unref();
  }
}

async function main() {
  console.log("========================================");
  console.log("  Academia / CursosVentas — arranque");
  console.log("========================================");

  ensureNode();
  ensureEnv();
  ensureUploads();
  ensureDeps();
  ensureDatabase();

  log("Iniciando servidor en http://localhost:3000");
  console.log("Admin: admin@academia.local / Admin123!");
  console.log("Dejá esta ventana ABIERTA mientras usás la app.\n");

  // Abrir browser en paralelo cuando el server responda
  openBrowser();

  const child = spawn("npx", ["next", "dev", "-p", "3000"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      DATABASE_URL: "file:./dev.db",
    },
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error(err);
  fail(String(err && err.message ? err.message : err));
});
