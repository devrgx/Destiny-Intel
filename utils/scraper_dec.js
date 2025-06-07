const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const BASE_URL = "https://destinyemblemcollector.com";
const outputPath = path.join(__dirname, "../bot/data/emblems.json");

async function getEmblemList() {
  try {
    const res = await axios.get(`${BASE_URL}/destiny2`);
    const $ = cheerio.load(res.data);
    const emblems = [];

    $(".gridemblem-index .emblem a").each((_, el) => {
      const href = $(el).attr("href");
      const idMatch = href.match(/id=(\d+)/);
      const id = idMatch ? idMatch[1] : null;
      const name = $(el).find("h2").text().trim();
      if (id && name) emblems.push({ id, name });
    });

    console.log(chalk.green(`📦 Found ${emblems.length} emblems from DEC.`));
    return emblems;
  } catch (err) {
    console.error(chalk.red("❌ Failed to load emblem list:"), err.message);
    process.exit(1);
  }
}

async function getEmblemDetails(id) {
  try {
    const res = await axios.get(`${BASE_URL}/emblem?id=${id}`);
    const $ = cheerio.load(res.data);

    const imageUrls = [];
    let source = "";
    const requirements = [];
    let available = false;
    let foundRequirement = false;

    // 🔍 Verfügbarkeit prüfen (genaue Texte)
    const statusParagraph = $("p").filter((_, el) => {
      const text = $(el).text().trim();
      return text.includes("Emblem Currently Available") || text.includes("Emblem Is NOT Currently Available");
    }).first();

    if (statusParagraph.length > 0) {
      const text = statusParagraph.text().trim();
      if (text === "Emblem Currently Available") {
        available = true;
      } else if (text === "Emblem Is NOT Currently Available") {
        available = false;
      } else {
        available = false;
      }
    }

    // 🔍 Bilder + Quelle
    $("div.gridemblem-emblemdetail").each((_, el) => {
      const img = $(el).find("img").attr("src");
      if (img) imageUrls.push(img);

      const text = $(el).text().trim();
      if (/^Source:/i.test(text)) {
        source = text.replace(/^Source:\s*/i, "").trim();
      }
    });

    // 🔍 Anforderungen aus gridemblem-info
    $(".gridemblem-info h3").each((_, el) => {
      const heading = $(el).text().trim().toLowerCase();
      if (heading === "detailed unlock requirements") {
        let sibling = $(el).next();
        while (sibling.length) {
          if (sibling[0].tagName === "h3") break;

          if (sibling.is("ul")) {
            sibling.find("li").each((_, li) => {
              const text = $(li).text().trim();
              if (text && !text.includes("provided by DEC")) {
                requirements.push(text);
                foundRequirement = true;
              }
            });
          }

          if (sibling.is("p")) {
            const text = sibling.text().trim();
            if (text && !text.includes("provided by DEC")) {
              requirements.push(text);
              foundRequirement = true;
            }
          }

          sibling = sibling.next();
        }
      }
    });

    // 🔍 Fallback: Zusätzliche Anforderungen aus gridemblem-emblemdetail
    if (!foundRequirement) {
      $("div.gridemblem-emblemdetail ul li").each((_, li) => {
        const text = $(li).text().trim();
        if (text && !text.includes("provided by DEC")) {
          requirements.push(text);
          foundRequirement = true;
        }
      });
    }

    if (!foundRequirement) {
      requirements.push("Unknown");
    }

    return { images: imageUrls, source, requirements, available };
  } catch (err) {
    console.error(chalk.red(`❌ [${id}] Details fetch failed:`), err.message);
    return null;
  }
}

(async () => {
  const baseEmblems = await getEmblemList();
  const fullEmblems = [];

  for (const emblem of baseEmblems) {
    const details = await getEmblemDetails(emblem.id);
    if (!details) {
      console.log(chalk.gray("⏭️ Skipped:"), emblem.name);
      continue;
    }

    fullEmblems.push({ ...emblem, ...details });
    console.log(chalk.blue("✏️ Scraped:"), emblem.name);
  }

  fs.writeFileSync(outputPath, JSON.stringify(fullEmblems, null, 2));
  console.log(chalk.green(`✅ Emblems saved to ${outputPath}`));
})();