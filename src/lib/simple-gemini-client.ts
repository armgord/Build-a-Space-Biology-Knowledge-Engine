/**
 * Cliente Gemini Simple para Prueba MVP
 * Solo lo esencial para hacer queries básicas
 */

export interface SimpleGeminiClient {
  simpleQuery: (prompt: string) => Promise<any>;
  analyzeURL: (url: string, prompt: string) => Promise<any>;
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
}
