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
   * NUEVO: Búsqueda completa automatizada - encuentra papers Y los analiza
   */
  async completeResearch(userQuery: string, papers: any[]): Promise<any> {
    try {
      console.log("🔬 Iniciando investigación completa automatizada...");

      // Preparar las URLs de los papers más relevantes
      const paperUrls = papers.slice(0, 5).map((paper) => paper.link); // Máximo 5 papers

      const researchPrompt = `
        Realiza una investigación completa automatizada para responder la consulta del usuario.
        
        CONSULTA DEL USUARIO: "${userQuery}"
        
        PAPERS DISPONIBLES PARA ANÁLISIS:
        ${papers
          .map(
            (paper, index) => `
        ${index + 1}. Título: ${paper.title}
        Año: ${paper.year}
        Keywords: ${paper.keywords.join(", ")}
        Abstract: ${paper.abstract}
        URL: ${paper.link}
        ---`
          )
          .join("")}
        
        INSTRUCCIONES:
        1. Analiza el contenido completo de las URLs más relevantes
        2. Extrae información específica que responda la consulta del usuario
        3. Identifica hallazgos clave, metodologías y resultados
        4. Sintetiza toda la información en un reporte completo
        
        Responde en JSON con este formato:
        {
          "relevantPapers": [
            {
              "title": "título del paper",
              "url": "URL del paper",
              "relevanceScore": 9.2,
              "keyFindings": ["hallazgo 1", "hallazgo 2", "hallazgo 3"],
              "methodology": "descripción de la metodología usada",
              "results": "resultados principales del estudio",
              "limitations": "limitaciones del estudio"
            }
          ],
          "synthesizedAnswer": "respuesta completa basada en todos los papers analizados",
          "keyInsights": ["insight 1", "insight 2", "insight 3"],
          "recommendations": ["recomendación 1", "recomendación 2"],
          "confidence": 8.5,
          "sources": ["URL1", "URL2", "URL3"]
        }
      `;

      return await this.queryWithURLContext(paperUrls, researchPrompt);
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
