# app.py
from flask import Flask, request, jsonify
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os

# Cargar variables de entorno (como GEMINI_API_KEY)
load_dotenv() 

# --- 1. Configuración Personalizable (Clave y Modelo) ---
API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = "gemini-2.5-flash"  # O "gemini-2.5-pro"
HOST = '0.0.0.0'
PORT = 3000

app = Flask(__name__)

# Configuración de CORS (necesario para que el frontend HTML pueda llamar al backend)
# En un entorno de producción, DEBERÍAS RESTRINGIR esto a tu dominio.
# Ejemplo: from flask_cors import CORS; CORS(app, resources={r"/chat": {"origins": "http://tu-dominio-frontend.com"}})

# Inicialización del cliente de Gemini
try:
    client = genai.Client(api_key=API_KEY)
except Exception as e:
    print(f"Error al inicializar el cliente de Gemini: {e}")
    client = None

# --- Parámetros del Modelo Personalizables ---
# Estos son los ajustes que controlan la respuesta del modelo
GENERATION_CONFIG = types.GenerateContentConfig(
    # 0.0 es predecible (menos creativo); 1.0 es más aleatorio (más creativo)
    temperature=0.7, 
    # Limita la longitud de la respuesta
    max_output_tokens=1024
)

# Instrucción para definir el rol y estilo del chatbot
SYSTEM_INSTRUCTION = (
    "Eres un asistente de soporte técnico cordial y profesional. "
    "Tu objetivo es dar soluciones claras y concisas en español."
)

# --- 2. EL ENDPOINT /CHAT ---
@app.route('/chat', methods=['POST'])
def chat_endpoint():
    # Verificar que el cliente se haya inicializado correctamente
    if not client:
        return jsonify({"success": False, "error": "API Key no configurada o inválida."}), 500

    # 1. Recibe el mensaje del usuario (prompt) desde el frontend
    try:
        data = request.get_json()
        prompt = data.get('prompt')
    except:
        return jsonify({"success": False, "error": "Solicitud JSON inválida."}), 400

    if not prompt:
        return jsonify({"success": False, "error": "El prompt es requerido."}), 400

    try:
        # Definir el contenido de la solicitud
        contents = [
            {"role": "user", "parts": [{"text": prompt}]}
        ]

        # 2. Utiliza el SDK para llamar a la API de Gemini
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents,
            config=GENERATION_CONFIG,
            system_instruction=SYSTEM_INSTRUCTION
        )

        # 3. Devuelve el texto de respuesta de Gemini al frontend
        gemini_response_text = response.text
        return jsonify({
            "success": True, 
            "response": gemini_response_text
        })

    except Exception as e:
        print(f"Error al llamar a la API de Gemini: {e}")
        return jsonify({"success": False, "error": f"Error interno al generar respuesta: {e}"}), 500

if __name__ == '__main__':
    print(f"Iniciando el backend en http://{HOST}:{PORT}")
    app.run(host=HOST, port=PORT)
