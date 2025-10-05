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
        console.error("❌ Error parsing JSON:", parseError);
        console.log("🔧 Intentando reparar JSON simple...");

        try {
          // Reparar JSON básico
          let repairedJSON = textResponse;

          // Reparar strings no terminadas
          const openQuotes = (repairedJSON.match(/"/g) || []).length;
          if (openQuotes % 2 !== 0) {
            repairedJSON = repairedJSON + '"';
          }

          // Cerrar objetos/arrays no cerrados
          const openBraces = (repairedJSON.match(/\{/g) || []).length;
          const closeBraces = (repairedJSON.match(/\}/g) || []).length;

          for (let i = 0; i < openBraces - closeBraces; i++) {
            repairedJSON += "}";
          }

          const repairedResponse = JSON.parse(repairedJSON);
          console.log("✅ JSON simple reparado exitosamente");
          return repairedResponse;
        } catch (repairError) {
          console.error("❌ No se pudo reparar JSON simple:", repairError);
          return { raw: textResponse };
        }
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
        10 // AUMENTADO: Máximo 10 papers para Gemini 2.0 Flash Experimental
      );

      // NUEVO: Eliminar duplicados por título (normalizado)
      const uniqueFilteredPapers = filteredPapers.filter(
        (paper, index, self) =>
          index ===
          self.findIndex(
            (p) =>
              p.paper.title.toLowerCase().replace(/[.,:;!?]*$/, "") ===
              paper.paper.title.toLowerCase().replace(/[.,:;!?]*$/, "")
          )
      );

      console.log(
        `✅ Papers filtrados: ${filteredPapers.length} → únicos: ${uniqueFilteredPapers.length}`
      );

      const comprehensivePrompt = `
        Realiza una investigación científica completa y automatizada en 4 pasos:

        CONSULTA DEL USUARIO: "${userQuery}"
        
        PAPERS PRE-FILTRADOS MÁS RELEVANTES:
        ${uniqueFilteredPapers
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
        
        PASO 1: ANÁLISIS DE TODOS LOS PAPERS PRE-FILTRADOS
        - Estos ${
          uniqueFilteredPapers.length
        } papers ya fueron seleccionados por relevancia usando algoritmo inteligente
        - ANALIZA TODOS Y CADA UNO de estos ${
          uniqueFilteredPapers.length
        } papers filtrados
        - NO descartes ninguno - todos son relevantes según el filtro previo
        - Explica por qué cada paper contribuye a responder la consulta
        
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
        IMPORTANTE: Debes incluir TODOS los ${
          uniqueFilteredPapers.length
        } papers pre-filtrados en tu respuesta.
        
        FORMATO DE RESPUESTA PROFESIONAL - MUY IMPORTANTE:
        - El "synthesizedAnswer" DEBE ser 100% contenido científico directo
        - PROHIBIDO mencionar: "proceso de filtrado", "búsqueda", "papers seleccionados", "algoritmo", "análisis", etc.
        - Escribe como si fueras un experto respondiendo directamente la pregunta científica
        - Usa referencias numeradas [1], [2], [3] después de CADA afirmación específica
        - Las referencias corresponden al índice del paper en la lista (empezando por [1])
        
        EJEMPLO PERFECTO (copia exactamente este estilo):
        "En microgravedad, el corazón experimenta varios cambios significativos. Al ingresar a este entorno, los fluidos corporales se desplazan hacia la cabeza, aumentando inicialmente el volumen sistólico y el gasto cardíaco, pero induciendo simultáneamente hipovolemia (disminución del volumen sanguíneo) de aproximadamente 10-15% [1]. La ausencia de presión ortostática y la reducción en la carga de trabajo cardíaco contribuyen al desarrollo de atrofia cardíaca, es decir, una disminución en el tamaño y masa del músculo cardíaco [2]. Además, se observan alteraciones en la función contráctil, remodelación estructural y cambios en la expresión génica relacionada con el manejo del calcio y el estrés oxidativo, lo que puede afectar la contractilidad y la salud cardíaca general [3]. Durante el vuelo espacial, también se reportan disminuciones en la frecuencia cardíaca y la presión arterial, así como una mayor incidencia de arritmias y una reducción en la variabilidad de la frecuencia cardíaca [4]. A nivel celular, existe disfunción endotelial, aumento de la apoptosis y estrés proteostático, sugiriendo que el corazón es especialmente sensible a la falta de gravedad [5]."
        
        - COPIA EXACTAMENTE este formato: específico, directo, con datos cuantitativos y referencias
        - NO uses frases genéricas como "estudios muestran" - sé específico con los hallazgos
        - Incluye números exactos, porcentajes, y datos cuantitativos cuando estén disponibles
        - Cada párrafo debe tener información sustancial y específica
        
        Responde ÚNICAMENTE en JSON con este formato exacto:
        {
          "synthesizedAnswer": "respuesta científica profesional con referencias numeradas [1], [2], [3] que corresponden al índice de los papers en la lista",
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
          "keyInsights": ["insight científico importante 1", "insight científico importante 2", "insight científico importante 3"],
          "recommendations": ["recomendación práctica 1", "recomendación para futuras investigaciones 2"],
          "confidence": 8.5,
          "sources": ["URL1", "URL2", "URL3"]
        }
      `;

      // Extraer URLs solo de los papers ÚNICOS FILTRADOS
      const uniqueFilteredUrls = uniqueFilteredPapers.map(
        (filtered) => filtered.paper.link
      );

      console.log(
        `🌐 URLs a analizar: ${uniqueFilteredUrls.length} únicos (vs ${papers.length} originales)`
      );

      // VALIDACIÓN: Asegurar límite de URLs para Gemini 2.0 Flash Experimental
      if (uniqueFilteredUrls.length > 10) {
        console.warn(
          `⚠️ Limitando URLs de ${uniqueFilteredUrls.length} a 10 para Gemini Experimental`
        );
        uniqueFilteredUrls.splice(10); // Mantener solo los primeros 10
      }

      return await this.queryWithURLContext(
        uniqueFilteredUrls,
        comprehensivePrompt
      );
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
              maxOutputTokens: 8192, // AUMENTADO: Más tokens para análisis profundo
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
        console.log("🔧 Intentando reparar JSON truncado...");

        try {
          // Intentar reparar JSON común: strings no terminadas, brackets faltantes
          let repairedJSON = textResponse;

          // Reparar strings no terminadas
          const openQuotes = (repairedJSON.match(/"/g) || []).length;
          if (openQuotes % 2 !== 0) {
            console.log("🔧 Agregando comilla faltante...");
            repairedJSON = repairedJSON + '"';
          }

          // Contar brackets y llaves para balancear
          const openBrackets = (repairedJSON.match(/\[/g) || []).length;
          const closeBrackets = (repairedJSON.match(/\]/g) || []).length;
          const openBraces = (repairedJSON.match(/\{/g) || []).length;
          const closeBraces = (repairedJSON.match(/\}/g) || []).length;

          // Cerrar arrays no cerrados
          for (let i = 0; i < openBrackets - closeBrackets; i++) {
            repairedJSON += "]";
          }

          // Cerrar objetos no cerrados
          for (let i = 0; i < openBraces - closeBraces; i++) {
            repairedJSON += "}";
          }

          // Intentar parsear el JSON reparado
          const repairedResponse = JSON.parse(repairedJSON);
          console.log("✅ JSON reparado exitosamente");

          // Validar que tenga la estructura mínima esperada
          if (!repairedResponse.relevantPapers) {
            console.log("🔧 No se pudieron parsear los papers relevantes");
            repairedResponse.relevantPapers = [];
          }

          return repairedResponse;
        } catch (repairError) {
          console.error("❌ No se pudo reparar el JSON:", repairError);

          // Respuesta de respaldo con estructura básica
          const fallbackResponse = {
            synthesizedAnswer:
              "Error procesando la respuesta completa. Por favor, intenta con una consulta más específica.",
            relevantPapers: [],
            keyInsights: [
              "Ocurrió un error al procesar la información completa",
            ],
            recommendations: [
              "Intenta reformular tu consulta o ser más específico",
            ],
            confidence: 0,
            sources: [],
            raw: textResponse,
          };

          console.log("🔄 Usando respuesta de respaldo:", fallbackResponse);
          return fallbackResponse;
        }
      }
    } catch (error) {
      console.error("❌ Error in queryWithURLContext:", error);
      throw error;
    }
  }
}
