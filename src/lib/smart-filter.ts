/**
 * Filtrado Inteligente de Papers
 * Reduce 600+ papers a los 10-15 más relevantes ANTES de enviar a Gemini
 */

export interface FilteredPaper {
  paper: any;
  relevanceScore: number;
  matchedKeywords: string[];
  titleMatch: boolean;
  abstractMatch: boolean;
}

export class SmartPaperFilter {
  /**
   * Filtrado inteligente por múltiples criterios
   */
  static filterRelevantPapers(
    papers: any[],
    userQuery: string,
    maxResults: number = 5 // AJUSTADO: Gemini Free Tier límite conservador
  ): FilteredPaper[] {
    console.log(`🔍 Filtrando ${papers.length} papers para: "${userQuery}"`);

    const queryWords = this.extractKeywords(userQuery);
    const scoredPapers: FilteredPaper[] = [];

    papers.forEach((paper) => {
      const score = this.calculateRelevanceScore(paper, queryWords, userQuery);

      if (score.relevanceScore > 0.1) {
        // Umbral mínimo REDUCIDO para debug
        scoredPapers.push(score);
      }

      // DEBUG: Log papers cardiovasculares específicos
      if (
        paper.title.toLowerCase().includes("cardiovascular") ||
        paper.title.toLowerCase().includes("cardiac") ||
        paper.title.toLowerCase().includes("heart")
      ) {
        console.log(
          `🩺 CARDIOVASCULAR PAPER: "${
            paper.title
          }" - Score: ${score.relevanceScore.toFixed(2)}`
        );
      }
    });

    // Ordenar por relevancia y tomar los mejores
    const filtered = scoredPapers
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);

    console.log(`✅ Filtrados: ${filtered.length} papers más relevantes`);
    console.log(
      `📊 Scores: ${filtered
        .map((p) => p.relevanceScore.toFixed(2))
        .join(", ")}`
    );

    // DEBUG: Mostrar títulos de papers seleccionados
    console.log(`📋 Papers seleccionados:`);
    filtered.forEach((paper, i) => {
      console.log(
        `   ${i + 1}. "${paper.paper.title}" (${paper.relevanceScore.toFixed(
          2
        )})`
      );
    });

    return filtered;
  }

  /**
   * Calcula score de relevancia usando múltiples criterios
   */
  private static calculateRelevanceScore(
    paper: any,
    queryWords: string[],
    userQuery: string
  ): FilteredPaper {
    let score = 0;
    const matchedKeywords: string[] = [];
    let titleMatch = false;
    let abstractMatch = false;

    // 1. Matching en título (peso alto)
    const titleScore = this.calculateTextMatch(paper.title, queryWords);
    if (titleScore > 0) {
      score += titleScore * 3; // Triple peso para título
      titleMatch = true;
    }

    // 2. Matching en keywords (peso muy alto)
    const keywordScore = this.calculateKeywordMatch(paper.keywords, queryWords);
    if (keywordScore.score > 0) {
      score += keywordScore.score * 4; // Cuádruple peso para keywords
      matchedKeywords.push(...keywordScore.matches);
    }

    // 3. Matching en abstract (peso medio)
    const abstractScore = this.calculateTextMatch(paper.abstract, queryWords);
    if (abstractScore > 0) {
      score += abstractScore * 1.5;
      abstractMatch = true;
    }

    // 4. Bonus por año reciente
    const currentYear = new Date().getFullYear();
    const yearDiff = currentYear - paper.year;
    if (yearDiff < 5) score += 0.2; // Bonus por papers recientes

    // 5. Bonus por similitud semántica (sin ML, usando heurísticas)
    const semanticScore = this.calculateSemanticSimilarity(paper, userQuery);
    score += semanticScore;

    // 6. NUEVO: Boost cardiovascular específico
    let cardiovascularBoost = 0;
    if (
      userQuery.toLowerCase().includes("cardiovascular") ||
      userQuery.toLowerCase().includes("cardiac") ||
      userQuery.toLowerCase().includes("heart")
    ) {
      const paperText = `${paper.title} ${paper.abstract} ${paper.keywords.join(
        " "
      )}`.toLowerCase();
      if (
        paperText.includes("cardiovascular") ||
        paperText.includes("cardiac") ||
        paperText.includes("heart") ||
        paperText.includes("cardiomyocyte")
      ) {
        cardiovascularBoost = 3.0; // BOOST SIGNIFICATIVO
        console.log(`💗 CARDIOVASCULAR BOOST: "${paper.title}"`);
      }
    }

    const finalScore = score + cardiovascularBoost;

    return {
      paper,
      relevanceScore: Math.min(finalScore, 10), // Cap a 10
      matchedKeywords,
      titleMatch,
      abstractMatch,
    };
  }

  /**
   * Extrae keywords relevantes de la consulta del usuario
   */
  private static extractKeywords(query: string): string[] {
    // Palabras comunes a filtrar
    const stopWords = new Set([
      "el",
      "la",
      "de",
      "que",
      "y",
      "a",
      "en",
      "un",
      "es",
      "se",
      "no",
      "te",
      "lo",
      "le",
      "da",
      "su",
      "por",
      "son",
      "con",
      "para",
      "al",
      "del",
      "los",
      "las",
      "una",
      "como",
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
      "¿",
      "?",
      "¿cómo",
      "cómo",
      "qué",
      "cuáles",
      "cuál",
      "dónde",
      "cuándo",
    ]);

    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
      .map((word) => word.trim());
  }

  /**
   * Calcula match en texto usando keywords
   */
  private static calculateTextMatch(
    text: string,
    queryWords: string[]
  ): number {
    if (!text) return 0;

    const lowerText = text.toLowerCase();
    let matches = 0;

    queryWords.forEach((word) => {
      if (lowerText.includes(word.toLowerCase())) {
        matches += 1;
      }
    });

    return matches / queryWords.length; // Proporción de matches
  }

  /**
   * Calcula match específico en keywords del paper
   */
  private static calculateKeywordMatch(
    paperKeywords: string[],
    queryWords: string[]
  ): { score: number; matches: string[] } {
    if (!paperKeywords) return { score: 0, matches: [] };

    const matches: string[] = [];
    let score = 0;

    paperKeywords.forEach((keyword) => {
      const keywordLower = keyword.toLowerCase();
      queryWords.forEach((queryWord) => {
        if (
          keywordLower.includes(queryWord.toLowerCase()) ||
          queryWord.toLowerCase().includes(keywordLower)
        ) {
          matches.push(keyword);
          score += 1;
        }
      });
    });

    return {
      score: score / Math.max(queryWords.length, 1),
      matches: [...new Set(matches)], // Remove duplicates
    };
  }

  /**
   * Similitud semántica básica sin ML (usando heurísticas)
   */
  private static calculateSemanticSimilarity(
    paper: any,
    userQuery: string
  ): number {
    const medicalTerms = {
      bone: [
        "hueso",
        "óseo",
        "osteoblast",
        "osteoclast",
        "calcium",
        "skeletal",
      ],
      muscle: ["músculo", "muscular", "myosin", "actin", "fiber", "strength"],
      heart: [
        "corazón",
        "cardio",
        "cardiac",
        "cardiovascular",
        "blood",
        "pressure",
      ],
      brain: ["cerebro", "neural", "neuron", "cognitive", "memory", "behavior"],
      microgravity: ["weightless", "zero-g", "spaceflight", "orbital", "space"],
      radiation: ["cosmic", "particle", "dose", "exposure", "shielding"],
      experiment: ["study", "research", "analysis", "investigation", "test"],
    };

    const queryLower = userQuery.toLowerCase();
    const paperText = `${paper.title} ${paper.abstract} ${paper.keywords.join(
      " "
    )}`.toLowerCase();

    let semanticScore = 0;

    Object.entries(medicalTerms).forEach(([concept, synonyms]) => {
      if (queryLower.includes(concept)) {
        synonyms.forEach((synonym) => {
          if (paperText.includes(synonym.toLowerCase())) {
            semanticScore += 0.1;
          }
        });
      }
    });

    return Math.min(semanticScore, 0.5); // Cap a 0.5
  }

  /**
   * Distribución inteligente para manejo de límites de API
   */
  static distributeForAPI(
    filteredPapers: FilteredPaper[],
    maxUrlsPerRequest: number = 5 // AJUSTADO: Gemini Free Tier límite
  ): FilteredPaper[][] {
    const batches: FilteredPaper[][] = [];

    for (let i = 0; i < filteredPapers.length; i += maxUrlsPerRequest) {
      batches.push(filteredPapers.slice(i, i + maxUrlsPerRequest));
    }

    return batches;
  }
}
