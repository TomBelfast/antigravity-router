// CLI: npm run login
// Starts OAuth flow, stores account credentials
import { createServer } from "node:http";
import { createInterface } from "node:readline";
import { buildAuthUrl, exchangeCode } from "./oauth.js";
import { loadAccounts, saveAccounts } from "./storage.js";

const CALLBACK_PORT = 51121;

async function login(): Promise<void> {
  console.log("\n  ╔══════════════════════════════════════════════════╗");
  console.log("  ║    Antigravity Cursor Proxy — Google Login       ║");
  console.log("  ╚══════════════════════════════════════════════════╝\n");

  const { url } = await buildAuthUrl();

  console.log("  1. Skopiuj poniższy link i otwórz go w przeglądarce na swoim komputerze:\n");
  console.log(`  \x1b[36m${url}\x1b[0m\n`);

  try {
    const { default: open } = await import("open");
    await open(url);
  } catch {
    // try to open, ignore failure on headless
  }

  console.log("  2. Po zalogowaniu w Google przeglądarka spróbuje wejść na adres localhost:51121.");
  console.log("     Jeśli strona pokaże błąd (brak połączenia) – TO NORMALNE na serwerze zdalnym!\n");
  console.log("  3. Skopiuj CAŁY adres z paska przeglądarki (zaczynający się od http://localhost:51121/...)");
  console.log("     i wklej go poniżej, a następnie naciśnij ENTER:\n");

  await new Promise<void>((resolve, reject) => {
    let resolved = false;

    async function processCode(code: string, state: string, fromHttp = false): Promise<void> {
      if (resolved) return;
      resolved = true;
      try {
        console.log("\n  Pobieram tokeny autoryzacyjne od Google...");
        const result = await exchangeCode(code, state);

        const accounts = loadAccounts();
        const existingIdx = accounts.findIndex((a) => a.email === result.email);

        const account = {
          email: result.email,
          refreshToken: result.refreshToken,
          accessToken: result.accessToken,
          accessTokenExpires: result.expiresAt,
          projectId: result.projectId,
        };

        if (existingIdx >= 0) {
          accounts[existingIdx] = account;
          console.log(`  Zaktualizowano istniejące konto: ${result.email}`);
        } else {
          accounts.push(account);
          console.log(`  Dodano nowe konto: ${result.email}`);
        }

        saveAccounts(accounts);

        console.log(`\n  ✅ Sukces! Zalogowano konto: ${result.email}`);
        console.log(`  ID Projektu: ${result.projectId || "(automatyczny)"}`);
        console.log(`  Konto zapisane w accounts.json.`);
        console.log(`\n  Teraz zrestartuj kontener: docker compose restart\n`);

        server.close();
        rl.close();
        resolve();
      } catch (err) {
        resolved = false;
        console.error(`\n  ❌ Błąd wymiany kodu: ${err instanceof Error ? err.message : String(err)}`);
        if (!fromHttp) {
          console.log("  Spróbuj wkleić adres URL ponownie:");
        }
      }
    }

    // 1. Terminal manual input reader
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("  Wklej tutaj adres URL z przeglądarki: ", (answer) => {
      const trimmed = answer.trim();
      if (!trimmed) return;
      try {
        let code: string | null = null;
        let state: string | null = null;
        if (trimmed.startsWith("http")) {
          const u = new URL(trimmed);
          code = u.searchParams.get("code");
          state = u.searchParams.get("state");
        } else if (trimmed.includes("code=")) {
          const u = new URL(`http://localhost/?${trimmed.replace(/^\?/, "")}`);
          code = u.searchParams.get("code");
          state = u.searchParams.get("state");
        }

        if (code && state) {
          processCode(code, state, false);
        } else {
          console.log("  ⚠️ Nie znaleziono parametrów 'code' i 'state' w podanym adresie.");
        }
      } catch (e) {
        console.log(`  ⚠️ Błąd parsowania adresu URL: ${e instanceof Error ? e.message : String(e)}`);
      }
    });

    // 2. HTTP callback server (for local or tunneled connections)
    const server = createServer(async (req, res) => {
      const fullUrl = new URL(req.url ?? "/", `http://localhost:${CALLBACK_PORT}`);
      if (!fullUrl.pathname.includes("oauth-callback")) {
        res.end("Not found");
        return;
      }

      const code = fullUrl.searchParams.get("code");
      const state = fullUrl.searchParams.get("state");

      if (!code || !state) {
        res.end("Missing code or state.");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px">
          <h2>✅ Autoryzacja zakończona sukcesem!</h2>
          <p>Możesz zamknąć tę kartę i wrócić do konsoli.</p>
        </body></html>
      `);

      processCode(code, state, true);
    });

    server.listen(CALLBACK_PORT, "0.0.0.0", () => {});
    server.on("error", () => {});
  });
}

login().catch((err) => {
  console.error("Login failed:", err);
  process.exit(1);
});
