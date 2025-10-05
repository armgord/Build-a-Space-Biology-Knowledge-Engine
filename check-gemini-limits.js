// Test rápido para verificar límites de tu API Gemini
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "YOUR_API_KEY";

async function checkGeminiLimits() {
  console.log("🔍 Verificando capacidades de Gemini...");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Test query: What are the current token limits and capabilities of this Gemini model? Respond with technical details about your configuration.",
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192, // Test límite alto
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("✅ RESPUESTA EXITOSA!");
      console.log("📊 Status:", response.status);
      console.log("🎯 Model: gemini-2.0-flash-exp");
      console.log("🔥 Capabilities: ADVANCED");

      if (data.candidates && data.candidates[0]) {
        const text = data.candidates[0].content.parts[0].text;
        console.log("💬 Respuesta:", text.substring(0, 200) + "...");
      }
    } else {
      console.log("❌ Error:", response.status, response.statusText);

      if (response.status === 429) {
        console.log("⚠️ LÍMITE DE RATE: API está limitada");
      } else if (response.status === 403) {
        console.log("⚠️ ACCESO DENEGADO: Verifica permisos");
      }
    }
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
  }
}

checkGeminiLimits();
