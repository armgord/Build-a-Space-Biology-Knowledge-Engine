// Debug del filtro inteligente
const fs = require("fs");

// Importar datos
const nasaArticles = JSON.parse(
  fs.readFileSync("./src/data/nasa_articles_context.json", "utf8")
);

// Query de prueba
const query = "cardiovascular effects spaceflight";

console.log("🔍 DEBUGEANDO FILTRO INTELIGENTE");
console.log(`📊 Total papers: ${nasaArticles.articles.length}`);
console.log(`🎯 Query: "${query}"`);

// Buscar papers que DEBERÍAN ser relevantes
const expectedRelevant = nasaArticles.articles.filter((paper) => {
  const title = paper.title.toLowerCase();
  const abstract = paper.abstract.toLowerCase();
  const keywords = paper.keywords.join(" ").toLowerCase();

  return (
    title.includes("cardiovascular") ||
    title.includes("cardiac") ||
    title.includes("heart") ||
    abstract.includes("cardiovascular") ||
    keywords.includes("cardiovascular")
  );
});

console.log(
  `\n✅ Papers cardiovasculares encontrados: ${expectedRelevant.length}`
);
expectedRelevant.forEach((paper, i) => {
  console.log(`${i + 1}. "${paper.title}" (${paper.year})`);
});

// Extraer palabras clave del query
const queryWords = query
  .toLowerCase()
  .split(/\s+/)
  .filter((word) => word.length > 2)
  .filter(
    (word) =>
      ![
        "the",
        "and",
        "or",
        "but",
        "in",
        "on",
        "at",
        "to",
        "for",
        "of",
        "with",
        "by",
      ].includes(word)
  );

console.log(`\n🔑 Query words: ${queryWords.join(", ")}`);

// Test scoring manual para el primer paper cardiovascular
if (expectedRelevant.length > 0) {
  const testPaper = expectedRelevant[0];
  console.log(`\n🧪 TESTING PAPER: "${testPaper.title}"`);

  // Title match
  const titleLower = testPaper.title.toLowerCase();
  let titleMatches = 0;
  queryWords.forEach((word) => {
    if (titleLower.includes(word)) {
      titleMatches++;
      console.log(`   ✅ Title match: "${word}"`);
    }
  });
  const titleScore = (titleMatches / queryWords.length) * 3;
  console.log(`   📊 Title score: ${titleScore}`);

  // Keywords match
  const paperKeywords = testPaper.keywords.map((k) => k.toLowerCase());
  let keywordMatches = 0;
  queryWords.forEach((word) => {
    paperKeywords.forEach((keyword) => {
      if (keyword.includes(word) || word.includes(keyword)) {
        keywordMatches++;
        console.log(`   ✅ Keyword match: "${word}" -> "${keyword}"`);
      }
    });
  });
  const keywordScore = (keywordMatches / Math.max(queryWords.length, 1)) * 4;
  console.log(`   📊 Keyword score: ${keywordScore}`);

  // Abstract match
  const abstractLower = testPaper.abstract.toLowerCase();
  let abstractMatches = 0;
  queryWords.forEach((word) => {
    if (abstractLower.includes(word)) {
      abstractMatches++;
      console.log(`   ✅ Abstract match: "${word}"`);
    }
  });
  const abstractScore = (abstractMatches / queryWords.length) * 1.5;
  console.log(`   📊 Abstract score: ${abstractScore}`);

  const totalScore = titleScore + keywordScore + abstractScore;
  console.log(`   🎯 TOTAL SCORE: ${totalScore.toFixed(2)}`);
}
