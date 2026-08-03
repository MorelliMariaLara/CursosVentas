using System.Diagnostics;

namespace CursosVentas.Launcher;

/// <summary>
/// Proyecto de INICIO del .sln.
/// F5 ejecuta el sitio web (Next.js) y abre el navegador en http://localhost:8080
/// </summary>
public static class Program
{
    public static int Main()
    {
        var root = FindWebRoot();
        Directory.SetCurrentDirectory(root);

        Console.WriteLine("========================================");
        Console.WriteLine("  Academia Certifica — sitio WEB");
        Console.WriteLine("  http://localhost:8080");
        Console.WriteLine("========================================");
        Console.WriteLine("Carpeta: " + root);
        Console.WriteLine();

        if (!File.Exists(Path.Combine(root, "scripts", "start-local.js")))
        {
            Console.Error.WriteLine("ERROR: no se encontró scripts/start-local.js");
            WaitExit();
            return 1;
        }

        if (!CommandExists("node"))
        {
            Console.Error.WriteLine("ERROR: falta Node.js en el PATH.");
            Console.Error.WriteLine("Instalá Node.js 20 LTS: https://nodejs.org/");
            Console.Error.WriteLine("Reiniciá la PC y Visual Studio.");
            try
            {
                Process.Start(new ProcessStartInfo("https://nodejs.org/") { UseShellExecute = true });
            }
            catch { /* ignore */ }
            WaitExit();
            return 1;
        }

        var nodeVersion = RunCapture("node", "-v");
        Console.WriteLine("Node: " + nodeVersion);
        if (nodeVersion.StartsWith("v24", StringComparison.Ordinal) ||
            nodeVersion.StartsWith("v25", StringComparison.Ordinal))
        {
            Console.WriteLine();
            Console.WriteLine("AVISO: Node 24/25 puede fallar en Windows.");
            Console.WriteLine("Usá Node.js 20 LTS desde https://nodejs.org/");
            Console.WriteLine();
        }

        Console.WriteLine("Iniciando sitio web...");
        Console.WriteLine("NO CIERRES esta ventana mientras uses la web.");
        Console.WriteLine();

        var psi = new ProcessStartInfo
        {
            FileName = "node",
            Arguments = "scripts/start-local.js",
            WorkingDirectory = root,
            UseShellExecute = false,
        };

        using var process = Process.Start(psi);
        if (process == null)
        {
            Console.Error.WriteLine("ERROR: no se pudo iniciar Node.");
            WaitExit();
            return 1;
        }

        process.WaitForExit();
        if (process.ExitCode != 0)
        {
            Console.Error.WriteLine("El servidor terminó con código " + process.ExitCode);
            WaitExit();
        }

        return process.ExitCode;
    }

    static string FindWebRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null)
        {
            var pkg = Path.Combine(dir.FullName, "package.json");
            var script = Path.Combine(dir.FullName, "scripts", "start-local.js");
            if (File.Exists(pkg) && File.Exists(script))
                return dir.FullName;
            dir = dir.Parent;
        }

        return Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));
    }

    static bool CommandExists(string name)
    {
        try
        {
            using var p = Process.Start(new ProcessStartInfo
            {
                FileName = OperatingSystem.IsWindows() ? "where" : "which",
                Arguments = name,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            });
            if (p == null) return false;
            p.WaitForExit(5000);
            return p.ExitCode == 0;
        }
        catch
        {
            return false;
        }
    }

    static string RunCapture(string file, string args)
    {
        try
        {
            using var p = Process.Start(new ProcessStartInfo
            {
                FileName = file,
                Arguments = args,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            });
            if (p == null) return "";
            var o = p.StandardOutput.ReadToEnd().Trim();
            p.WaitForExit(5000);
            return o;
        }
        catch
        {
            return "";
        }
    }

    static void WaitExit()
    {
        Console.WriteLine();
        Console.WriteLine("Presioná Enter para cerrar...");
        try { Console.ReadLine(); } catch { /* ignore */ }
    }
}
