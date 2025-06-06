const cron = require("node-cron");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { notifyOwner } = require("./api/utils/notify");

require("dotenv").config();

const LOG_FILE = path.join(__dirname, "logs", "cron-dynamic.log");
const TIMESTAMP = () => `[${new Date().toLocaleString("de-DE")}]`;

// 📂 Sicherstellen, dass logs/-Verzeichnis existiert
if (!fs.existsSync(path.dirname(LOG_FILE))) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
}

function log(message) {
  const entry = `${TIMESTAMP()} ${message}\n`;
  fs.appendFileSync(LOG_FILE, entry);
  console.log(entry.trim());
}

async function runDynamicScraper() {
  log("🔄 Starting automatic dynamic update...");

  exec("node scraper/scraper_es.js && node api/utils/importEmblems.js", async (err, stdout, stderr) => {
    if (err) {
      const errorMsg = `❌ Cron error: ${err.message}`;
      log(errorMsg);
      await notifyOwner(errorMsg);
    } else {
      const successMsg = `✅ scraper_es + importEmblems.js finished.`;
      log(successMsg);

      // stdout von importEmblems enthält ggf. Änderungstext
      const outputSummary = stdout.split("\n").filter(l => l.startsWith("📦") || l.startsWith("✅") || l.startsWith("🆕") || l.startsWith("✏️")).join("\n");
      await notifyOwner(`📊 Auto update (dynamic) completed:\n${outputSummary}`);
    }
  });
}

// Alle 6 Stunden → 0:00, 6:00, 12:00, 18:00
cron.schedule("0 */6 * * *", runDynamicScraper, {
  timezone: "Europe/Berlin",
});

log("🕒 Cron watcher started (every 6 hours for dynamic scraper)");