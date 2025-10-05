import os
import json
from typing import Any, Dict, List

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

try:
    import google.generativeai as genai
except Exception:  # pragma: no cover - optional at dev time
    genai = None


# Load environment variables from a .env file when available
load_dotenv()


# --- Flask application configuration ---

app = Flask(__name__)

allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "*")
allowed_origins: List[str] | str = (
    "*" if allowed_origins_env.strip() == "*" else [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
)
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})


# --- Helpers: Gemini integration ---

def _require_gemini() -> None:
    if genai is None:
        raise RuntimeError("google-generativeai is not installed. Add it to requirements.txt and install.")
    if not os.environ.get("GEMINI_API_KEY"):
        raise RuntimeError("GEMINI_API_KEY is not set")


def _get_gemini_model() -> Any:
    _require_gemini()
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])  # type: ignore[index]
    # Model consistent with frontend usage
    return genai.GenerativeModel("gemini-2.0-flash-exp")


def _generate_json_response(prompt: str, max_output_tokens: int = 4096) -> Dict[str, Any]:
    model = _get_gemini_model()
    generation_config = {
        "temperature": 0.1,
        "max_output_tokens": max_output_tokens,
        "response_mime_type": "application/json",
    }

    response = model.generate_content(
        contents=[{"role": "user", "parts": [{"text": prompt}]}],
        generation_config=generation_config,
    )
    text = getattr(response, "text", None) or ""
    try:
        return json.loads(text)
    except Exception:
        # Return raw text when JSON parsing fails
        return {"raw": text}


# --- Routes ---

@app.get("/")
def root() -> Any:
    return jsonify({"status": "ok", "service": "nasa-backend", "version": 1})


@app.get("/health")
def health() -> Any:
    has_key = bool(os.environ.get("GEMINI_API_KEY"))
    return jsonify({"ok": True, "hasApiKey": has_key})


@app.post("/api/simple_query")
def simple_query() -> Any:
    try:
        data = request.get_json(silent=True) or {}
        prompt = data.get("prompt", "").strip()
        if not prompt:
            return jsonify({"error": "Missing 'prompt'"}), 400

        result = _generate_json_response(prompt)
        return jsonify(result)
    except Exception as error:
        return jsonify({"error": str(error)}), 500


@app.post("/api/analyze_url")
def analyze_url() -> Any:
    try:
        data = request.get_json(silent=True) or {}
        url = (data.get("url") or "").strip()
        prompt = (data.get("prompt") or "").strip()
        if not url or not prompt:
            return jsonify({"error": "Missing 'url' or 'prompt'"}), 400

        full_prompt = (
            f"Analiza el contenido de esta URL: {url}\n\n{prompt}\n\n"
            "Si no puedes acceder a la URL, responde con un mensaje explicando la limitación."
        )
        result = _generate_json_response(full_prompt)
        return jsonify(result)
    except Exception as error:
        return jsonify({"error": str(error)}), 500


@app.post("/api/complete_research")
def complete_research() -> Any:
    try:
        data = request.get_json(silent=True) or {}
        user_query: str = (data.get("userQuery") or "").strip()
        papers: List[Dict[str, Any]] = data.get("papers") or []

        if not user_query or not isinstance(papers, list) or len(papers) == 0:
            return jsonify({"error": "Missing 'userQuery' or 'papers'"}), 400

        # Step 1: Select relevant papers
        selection_prompt = (
            "PASO 1: SELECCIÓN DE PAPERS RELEVANTES\n\n"
            f"CONSULTA DEL USUARIO: \"{user_query}\"\n\n"
            f"COLECCIÓN COMPLETA DE PAPERS NASA ({len(papers)} papers):\n" +
            "".join(
                [
                    (
                        f"{index + 1}. Título: {paper.get('title')}\n"
                        f"Año: {paper.get('year')}\n"
                        f"Keywords: {', '.join(paper.get('keywords', []))}\n"
                        f"Autores: {', '.join(paper.get('authors', []))}\n"
                        f"Abstract: {paper.get('abstract')}\n---\n"
                    )
                    for index, paper in enumerate(papers)
                ]
            ) +
            "\nINSTRUCCIONES:\n"
            "- Analiza título, keywords, autores y abstract de cada paper\n"
            "- Encuentra conexiones semánticas con la consulta del usuario\n"
            "- Selecciona ÚNICAMENTE los 5 papers MÁS relevantes\n\n"
            "Responde ÚNICAMENTE en JSON:\n"
            "{\n  \"selectedPapers\": [\n    {\n      \"title\": \"título exacto del paper\",\n      \"relevanceReason\": \"por qué es relevante para la consulta\"\n    }\n  ],\n  \"searchSummary\": \"explicación de la selección realizada\"\n}"
        )

        selection = _generate_json_response(selection_prompt)
        selected_titles = [p.get("title") for p in selection.get("selectedPapers", []) if p.get("title")]
        selected_papers = [p for p in papers if p.get("title") in selected_titles]
        selected_urls = [p.get("link") for p in selected_papers if p.get("link")][:20]

        # Step 2-4: Deep analysis and synthesis
        analysis_prompt = (
            "PASO 2-4: ANÁLISIS PROFUNDO Y SÍNTESIS\n\n"
            f"CONSULTA DEL USUARIO: \"{user_query}\"\n\n"
            "PAPERS SELECCIONADOS PARA ANÁLISIS PROFUNDO:\n" +
            "".join(
                [
                    (
                        f"{index + 1}. Título: {paper.get('title')}\n"
                        f"Año: {paper.get('year')}\n"
                        f"Keywords: {', '.join(paper.get('keywords', []))}\n"
                        f"Autores: {', '.join(paper.get('authors', []))}\n"
                        f"Abstract: {paper.get('abstract')}\n"
                        f"URL: {paper.get('link')}\n---\n"
                    )
                    for index, paper in enumerate(selected_papers)
                ]
            ) +
            "\nINSTRUCCIONES:\n"
            "- Accede al contenido completo de las URLs proporcionadas\n"
            "- Extrae metodología, resultados y limitaciones de cada paper\n"
            "- Sintetiza toda la información en una respuesta completa\n\n"
            "Responde ÚNICAMENTE en JSON con esta estructura:\n"
            "{\n  \"searchSummary\": \"\",\n  \"relevantPapers\": [\n    {\n      \"title\": \"\",\n      \"url\": \"\",\n      \"year\": 0,\n      \"authors\": [\"\"],\n      \"relevanceScore\": 0,\n      \"relevanceReason\": \"\",\n      \"keyFindings\": [\"\"],\n      \"methodology\": \"\",\n      \"results\": \"\",\n      \"limitations\": \"\"\n    }\n  ],\n  \"synthesizedAnswer\": \"\",\n  \"keyInsights\": [\"\"],\n  \"recommendations\": [\"\"],\n  \"confidence\": 0,\n  \"totalPapersAnalyzed\": 0,\n  \"sources\": [\"\"]\n}"
        )

        analysis = _generate_json_response(analysis_prompt)

        # Ensure fields present
        analysis.setdefault("searchSummary", selection.get("searchSummary"))
        analysis.setdefault("totalPapersAnalyzed", len(selected_papers))
        if "sources" not in analysis:
            analysis["sources"] = selected_urls

        return jsonify(analysis)
    except Exception as error:
        return jsonify({"error": str(error)}), 500


# --- Entrypoint ---

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    print(f"Backend running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
