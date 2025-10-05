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
   * 1. Encuentra papers relevantes (como simpleQuery)
   * 2. Genera resumen de relevancia
   * 3. Analiza contenido completo de cada paper
   * 4. Sintetiza todo en reporte final
   */
  async completeResearch(userQuery: string, papers: any[]): Promise<any> {
    try {
      console.log("🔬 Iniciando investigación completa automatizada...");

      const comprehensivePrompt = `
        Realiza una investigación científica completa y automatizada en 4 pasos:

        CONSULTA DEL USUARIO: "${userQuery}"
        
        COLECCIÓN COMPLETA DE PAPERS NASA:
        ${papers
          .map(
            (paper, index) => `
        ${index + 1}. Título: ${paper.title}
        Año: ${paper.year}
        Keywords: ${paper.keywords.join(", ")}
        Autores: ${paper.authors.join(", ")}
        Abstract: ${paper.abstract}
        URL: ${paper.link}
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

      // LÍMITE IMPORTANTE: Gemini 2.0 Flash solo permite 20 URLs por request
      // Primero usamos simpleQuery para encontrar los papers más relevantes
      console.log(`📊 Total papers disponibles: ${papers.length}`);

      // Hacer selección inteligente PRIMERO (sin URLs)
      const selectionPrompt = `
        PASO 1: SELECCIÓN DE PAPERS RELEVANTES
        
        CONSULTA DEL USUARIO: "${userQuery}"
        
        COLECCIÓN COMPLETA DE PAPERS NASA (${papers.length} papers):
        ${papers
          .map(
            (paper, index) => `
        ${index + 1}. Título: ${paper.title}
        Año: ${paper.year}
        Keywords: ${paper.keywords.join(", ")}
        Autores: ${paper.authors.join(", ")}
        Abstract: ${paper.abstract}
        ---`
          )
          .join("")}

        INSTRUCCIONES:
        - Analiza título, keywords, autores y abstract de cada paper
        - Encuentra conexiones semánticas con la consulta del usuario
        - Selecciona ÚNICAMENTE los 5 papers MÁS relevantes
        - Explica brevemente por qué cada paper es relevante
        
        Responde ÚNICAMENTE en JSON:
        {
          "selectedPapers": [
            {
              "title": "título exacto del paper",
              "relevanceReason": "por qué es relevante para la consulta"
            }
          ],
          "searchSummary": "explicación de la selección realizada"
        }
      `;

      console.log("🎯 Paso 1: Seleccionando papers más relevantes...");
      const selection = await this.simpleQuery(selectionPrompt);

      // Encontrar los papers seleccionados y sus URLs
      const selectedPapers = selection.selectedPapers
        .map((selected: any) => {
          return papers.find((paper: any) => paper.title === selected.title);
        })
        .filter(Boolean);

      const selectedUrls = selectedPapers
        .map((paper: any) => paper.link)
        .slice(0, 20); // Máximo 20 URLs
      console.log(
        `🔗 Paso 2: Analizando contenido de ${selectedUrls.length} papers seleccionados...`
      );

      // Ahora hacer el análisis profundo con las URLs seleccionadas
      const analysisPrompt = `
        PASO 2-4: ANÁLISIS PROFUNDO Y SÍNTESIS
        
        CONSULTA DEL USUARIO: "${userQuery}"
        
        PAPERS SELECCIONADOS PARA ANÁLISIS PROFUNDO:
        ${selectedPapers
          .map(
            (paper: any, index: number) => `
        ${index + 1}. Título: ${paper.title}
        Año: ${paper.year}
        Keywords: ${paper.keywords.join(", ")}
        Autores: ${paper.authors.join(", ")}
        Abstract: ${paper.abstract}
        URL: ${paper.link}
        ---`
          )
          .join("")}

        INSTRUCCIONES:
        - Accede al contenido completo de las URLs proporcionadas
        - Extrae metodología, resultados y limitaciones de cada paper
        - Sintetiza toda la información en una respuesta completa
        
        Responde ÚNICAMENTE en JSON:
        {
          "searchSummary": "${selection.searchSummary}",
          "relevantPapers": [
            {
              "title": "título exacto del paper",
              "url": "URL completa del paper",
              "year": año,
              "authors": ["autor1", "autor2"],
              "relevanceScore": 9.2,
              "relevanceReason": "por qué este paper es relevante",
              "keyFindings": ["hallazgo específico 1", "hallazgo específico 2"],
              "methodology": "metodología detallada del estudio",
              "results": "resultados principales y datos cuantitativos",
              "limitations": "limitaciones del estudio"
            }
          ],
          "synthesizedAnswer": "respuesta completa basada en todos los papers analizados",
          "keyInsights": ["insight científico 1", "insight científico 2"],
          "recommendations": ["recomendación práctica 1", "recomendación 2"],
          "confidence": 8.5,
          "totalPapersAnalyzed": ${selectedPapers.length},
          "sources": ${JSON.stringify(selectedUrls)}
        }
      `;

      return await this.queryWithURLContext(selectedUrls, analysisPrompt);
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
