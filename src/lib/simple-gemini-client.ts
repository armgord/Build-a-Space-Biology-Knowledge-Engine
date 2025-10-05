/**
 * Cliente Gemini Simple para Prueba MVP
 * Solo lo esencial para hacer queries básicas
 */

export interface SimpleGeminiClient {
  simpleQuery: (prompt: string) => Promise<any>;
  analyzeURL: (url: string, prompt: string) => Promise<any>;
  completeResearch: (userQuery: string, papers: any[]) => Promise<any>;
  queryWithURLContext: (urls: string[], prompt: string) => Promise<any>;
}

export class SimpleGeminiHTTPClient implements SimpleGeminiClient {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseURL = "https://generativelanguage.googleapis.com/v1beta/models";
  }

  /**
   * Query simple a Gemini - solo texto
   */
  async simpleQuery(prompt: string): Promise<any> {
    try {
      console.log("🤖 Enviando query a Gemini...");
      console.log("📝 Prompt enviado:", prompt.substring(0, 200) + "...");

      const response = await fetch(
        `${this.baseURL}/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2048,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No response from Gemini");
      }

      const textResponse = data.candidates[0].content.parts[0].text;
      console.log("🔄 Respuesta de Gemini:", textResponse);

      try {
        const parsedResponse = JSON.parse(textResponse);
        console.log("✅ JSON parseado exitosamente:", parsedResponse);
        return parsedResponse;
      } catch (parseError) {
        console.error(
          "❌ Failed to parse JSON, returning raw text:",
          textResponse
        );
        console.error("Parse error:", parseError);
        return { raw: textResponse };
      }
    } catch (error) {
      console.error("❌ Error in simpleQuery:", error);
      throw error;
    }
  }

  /**
   * Analizar URL específica - para papers
   */
  async analyzeURL(url: string, prompt: string): Promise<any> {
    try {
      console.log("🔗 Analizando URL con Gemini:", url);

      const fullPrompt = `
        Analiza el contenido de esta URL: ${url}
        
        ${prompt}
        
        Si no puedes acceder a la URL, responde con un mensaje explicando la limitación.
      `;

      // Por ahora usamos el mismo método simple
      // En el futuro podríamos usar BioPython para extraer el contenido primero
      return await this.simpleQuery(fullPrompt);
    } catch (error) {
      console.error("❌ Error in analyzeURL:", error);
      throw error;
    }
  }

  /**
   * NUEVO: Investigación completa automatizada - TODO en una sola llamada
   * 1. FILTRADO INTELIGENTE pre-procesamiento
   * 2. Encuentra papers relevantes (como simpleQuery)
   * 3. Genera resumen de relevancia
   * 4. Analiza contenido completo de cada paper
   * 5. Sintetiza todo en reporte final
   */
  async completeResearch(userQuery: string, papers: any[]): Promise<any> {
    try {
      console.log("🔬 Iniciando investigación completa automatizada...");

      // NUEVO: Importar y usar filtro inteligente
      const { SmartPaperFilter } = await import("./smart-filter");

      // PASO 1: Filtrado inteligente ANTES de enviar a Gemini
      console.log(`📊 Papers totales: ${papers.length}`);
      const filteredPapers = SmartPaperFilter.filterRelevantPapers(
        papers,
        userQuery,
        5 // AJUSTADO: Máximo 5 papers para Gemini Free Tier
      );
      console.log(`✅ Papers filtrados: ${filteredPapers.length}`);

      const comprehensivePrompt = `
        Realiza una investigación científica completa y automatizada en 4 pasos:

        CONSULTA DEL USUARIO: "${userQuery}"
        
        PAPERS PRE-FILTRADOS MÁS RELEVANTES:
        ${filteredPapers
          .map(
            (filtered, index) => `
        ${index + 1}. Título: ${filtered.paper.title}
        Año: ${filtered.paper.year}
        Keywords: ${filtered.paper.keywords.join(", ")}
        Autores: ${filtered.paper.authors.join(", ")}
        Abstract: ${filtered.paper.abstract}
        URL: ${filtered.paper.link}
        SCORE RELEVANCIA: ${filtered.relevanceScore.toFixed(2)}/10
        KEYWORDS MATCHED: ${filtered.matchedKeywords.join(", ")}
        ---`
          )
          .join("")}

        INSTRUCCIONES PASO A PASO:
        
        PASO 1: SELECCIÓN DE PAPERS RELEVANTES
        - Analiza título, keywords, autores y abstract de cada paper
        - Encuentra conexiones semánticas con la consulta del usuario
        - Selecciona los 3-5 papers MÁS relevantes
        - Explica brevemente por qué cada paper es relevante
        
        PASO 2: ANÁLISIS PROFUNDO DE CONTENIDO
        - Accede al contenido completo de las URLs de los papers seleccionados
        - Extrae metodología específica utilizada
        - Identifica resultados principales y hallazgos clave
        - Reconoce limitaciones y consideraciones importantes
        
        PASO 3: SÍNTESIS INTELIGENTE
        - Combina información de todos los papers analizados
        - Genera respuesta completa y coherente a la consulta
        - Identifica patrones y conexiones entre estudios
        - Deriva insights y recomendaciones basadas en evidencia
        
        PASO 4: REPORTE ESTRUCTURADO
        Responde ÚNICAMENTE en JSON con este formato exacto:
        {
          "searchSummary": "explicación de por qué estos papers son los más relevantes para la consulta",
          "relevantPapers": [
            {
              "title": "título exacto del paper",
              "url": "URL completa del paper",
              "year": año,
              "authors": ["autor1", "autor2"],
              "relevanceScore": 9.2,
              "relevanceReason": "por qué este paper es relevante para la consulta",
              "keyFindings": ["hallazgo específico 1", "hallazgo específico 2", "hallazgo específico 3"],
              "methodology": "descripción detallada de la metodología utilizada en el estudio",
              "results": "resultados principales y datos cuantitativos del estudio",
              "limitations": "limitaciones reconocidas del estudio y consideraciones importantes"
            }
          ],
          "synthesizedAnswer": "respuesta completa y detallada a la consulta del usuario, basada en todos los papers analizados",
          "keyInsights": ["insight científico importante 1", "insight científico importante 2", "insight científico importante 3"],
          "recommendations": ["recomendación práctica 1", "recomendación para futuras investigaciones 2"],
          "confidence": 8.5,
          "totalPapersAnalyzed": número,
          "sources": ["URL1", "URL2", "URL3"]
        }
      `;

      // Extraer URLs solo de los papers FILTRADOS (máximo 5 vs 600+)
      const filteredUrls = filteredPapers.map(
        (filtered) => filtered.paper.link
      );

      console.log(
        `🌐 URLs a analizar: ${filteredUrls.length} (vs ${papers.length} originales)`
      );

      // VALIDACIÓN: Asegurar límite de URLs para Free Tier
      if (filteredUrls.length > 5) {
        console.warn(
          `⚠️ Limitando URLs de ${filteredUrls.length} a 5 para Free Tier`
        );
        filteredUrls.splice(5); // Mantener solo los primeros 5
      }

      return await this.queryWithURLContext(filteredUrls, comprehensivePrompt);
    } catch (error) {
      console.error("❌ Error in completeResearch:", error);
      throw error;
    }
  }

  /**
   * NUEVO: Query con contexto de múltiples URLs
   */
  async queryWithURLContext(urls: string[], prompt: string): Promise<any> {
    try {
      // VALIDACIÓN: Límite estricto para Free Tier
      if (urls.length > 5) {
        console.warn(
          `⚠️ URLs exceden límite: ${urls.length} > 5. Recortando...`
        );
        urls = urls.slice(0, 5);
      }

      console.log(`🌐 Analizando ${urls.length} URLs con contexto...`);

      const response = await fetch(
        `${this.baseURL}/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  ...urls.map((url) => ({
                    text: `Analiza también el contenido de: ${url}`,
                  })),
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 4096, // Más tokens para análisis completo
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No response from Gemini");
      }

      const textResponse = data.candidates[0].content.parts[0].text;
      console.log("✅ Respuesta completa recibida");

      try {
        const parsedResponse = JSON.parse(textResponse);
        console.log("🎯 Investigación completa exitosa:", parsedResponse);
        return parsedResponse;
      } catch (parseError) {
        console.error("❌ Error parsing JSON:", parseError);
        return { raw: textResponse };
      }
    } catch (error) {
      console.error("❌ Error in queryWithURLContext:", error);
      throw error;
    }
  }
}
