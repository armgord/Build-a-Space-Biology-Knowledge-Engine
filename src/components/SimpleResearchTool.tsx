/**
 * Herramienta Simple de Investigación NASA
 * Prueba MVP para validar la idea
 */

import React, { useState } from "react";
import { useSimpleNASAAPIContext } from "../contexts/NASAAPIContext";
import {
  NASAPaper,
  SearchResult,
  PaperAnalysis,
  CompleteResearchResult,
} from "../types/nasa-types";

// Importamos los datos del JSON
import nasaArticles from "../data/nasa_articles_context.json";

const SimpleResearchTool: React.FC = () => {
  const [userQuery, setUserQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<NASAPaper | null>(null);
  const [paperAnalysis, setPaperAnalysis] = useState<PaperAnalysis | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // NUEVO: Estado para investigación completa automatizada
  const [completeResult, setCompleteResult] =
    useState<CompleteResearchResult | null>(null);
  const [isResearching, setIsResearching] = useState(false);

  const { client, connected } = useSimpleNASAAPIContext();

  // NUEVO: Investigación completa automatizada
  const handleCompleteResearch = async () => {
    if (!userQuery.trim() || !connected) return;

    setIsResearching(true);
    setCompleteResult(null);
    setSearchResults(null);
    setPaperAnalysis(null);

    try {
      console.log("🚀 Iniciando investigación completa para:", userQuery);

      // Usar todos los papers disponibles para el análisis
      const allPapers = (nasaArticles as any).articles;

      const result = await client.completeResearch(userQuery, allPapers);

      setCompleteResult(result);
      console.log("✅ Investigación completa finalizada:", result);
    } catch (error) {
      console.error("❌ Error en investigación completa:", error);
      alert("Error en la investigación. Revisa la consola.");
    } finally {
      setIsResearching(false);
    }
  };

  // Paso 1: Buscar papers relevantes en el JSON usando Gemini
  const handleSearch = async () => {
    if (!userQuery.trim() || !connected) return;

    setIsSearching(true);
    setSearchResults(null);

    try {
      console.log("🔍 Buscando papers relevantes para:", userQuery);

      // Crear prompt optimizado para Gemini con más contexto
      const searchPrompt = `
        Analiza esta colección de papers de NASA y encuentra los más relevantes para la consulta del usuario.
        
        CONSULTA DEL USUARIO: "${userQuery}"
        
        PAPERS DISPONIBLES:
        ${(nasaArticles as any).articles
          .map(
            (paper: any) => `
        Título: ${paper.title}
        Año: ${paper.year}
        Keywords: ${paper.keywords.join(", ")}
        Autores: ${paper.authors.join(", ")}
        Abstract: ${paper.abstract}
        ---
        `
          )
          .join("")}
        
        INSTRUCCIONES:
        - Analiza título, keywords, autores y abstract de cada paper
        - Encuentra conexiones semánticas con la consulta del usuario
        - Prioriza papers con keywords relevantes
        - Considera la reputación de los autores si es relevante
        
        Responde en JSON con este formato:
        {
          "relevantPapers": [lista de títulos de los 3-5 papers más relevantes],
          "summary": "breve explicación de por qué estos papers son relevantes, mencionando keywords clave encontradas"
        }
      `;

      // Usar el cliente Gemini
      const response = await client.simpleQuery(searchPrompt);

      // Procesar resultados
      const relevantTitles = response.relevantPapers;
      const relevantPapers = (nasaArticles as any).articles.filter(
        (paper: any) => relevantTitles.includes(paper.title)
      );

      setSearchResults({
        relevantPapers,
        searchQuery: userQuery,
        summary: response.summary,
      });
    } catch (error) {
      console.error("❌ Error en búsqueda:", error);
      alert("Error al buscar. Revisa la consola.");
    } finally {
      setIsSearching(false);
    }
  };

  // Paso 2: Analizar paper específico usando la URL
  const handleAnalyzePaper = async (paper: NASAPaper) => {
    setSelectedPaper(paper);
    setIsAnalyzing(true);
    setPaperAnalysis(null);

    try {
      console.log("🔬 Analizando paper:", paper.title);

      const analysisPrompt = `
        Analiza este paper de NASA en detalle para la consulta: "${userQuery}"
        
        URL: ${paper.link}
        Título: ${paper.title}
        
        Responde en JSON:
        {
          "keyFindings": ["hallazgo 1", "hallazgo 2", "hallazgo 3"],
          "relevanceScore": 8.5,
          "summary": "resumen de cómo este paper responde a la consulta del usuario"
        }
      `;

      const response = await client.analyzeURL(paper.link, analysisPrompt);

      setPaperAnalysis({
        title: paper.title,
        url: paper.link,
        keyFindings: response.keyFindings,
        relevanceScore: response.relevanceScore,
        summary: response.summary,
      });
    } catch (error) {
      console.error("❌ Error en análisis:", error);
      alert("Error al analizar. Revisa la consola.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="simple-research-tool">
      <h1>🚀 NASA Research Tool - Prueba Simple</h1>

      {/* Paso 1: Input de búsqueda */}
      <div className="search-section">
        <h2>¿Qué quieres investigar?</h2>
        <input
          type="text"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          placeholder="Ej: efectos de microgravedad en huesos"
          className="search-input"
        />
        <div className="button-group">
          <button
            onClick={handleSearch}
            disabled={isSearching || !connected || isResearching}
            className="search-button"
          >
            {isSearching ? "🔍 Buscando..." : "🔍 Buscar Papers"}
          </button>

          <button
            onClick={handleCompleteResearch}
            disabled={isResearching || !connected || isSearching}
            className="research-button"
          >
            {isResearching ? "🚀 Investigando..." : "🚀 Investigación Completa"}
          </button>
        </div>
      </div>

      {/* Resultados de búsqueda */}
      {searchResults && (
        <div className="search-results">
          <h3>📋 Papers Relevantes Encontrados:</h3>
          <p>
            <strong>Resumen:</strong> {searchResults.summary}
          </p>

          <div className="papers-list">
            {searchResults.relevantPapers.map((paper, index) => (
              <div key={index} className="paper-card">
                <h4>{paper.title}</h4>
                <p>
                  <strong>Año:</strong> {paper.year}
                </p>
                <p>
                  <strong>Abstract:</strong> {paper.abstract.substring(0, 200)}
                  ...
                </p>
                <button
                  onClick={() => handleAnalyzePaper(paper)}
                  disabled={isAnalyzing}
                  className="analyze-button"
                >
                  {isAnalyzing && selectedPaper?.title === paper.title
                    ? "🔬 Analizando..."
                    : "🔬 Analizar Paper"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NUEVO: Resultados de investigación completa */}
      {completeResult && (
        <div className="complete-research-results">
          <h2>🎯 Investigación Completa Automatizada</h2>

          <div className="research-summary">
            <h3>📋 Respuesta Sintetizada</h3>
            <p className="synthesized-answer">
              {completeResult.synthesizedAnswer}
            </p>

            <div className="confidence-score">
              <strong>🎯 Confianza: {completeResult.confidence}/10</strong>
            </div>
          </div>

          <div className="key-insights">
            <h3>💡 Insights Clave</h3>
            <ul>
              {completeResult.keyInsights.map((insight, index) => (
                <li key={index}>{insight}</li>
              ))}
            </ul>
          </div>

          <div className="recommendations">
            <h3>🔬 Recomendaciones</h3>
            <ul>
              {completeResult.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>

          <div className="analyzed-papers">
            <h3>
              📚 Papers Analizados ({completeResult.relevantPapers.length})
            </h3>
            {completeResult.relevantPapers.map((paper, index) => (
              <div key={index} className="analyzed-paper-card">
                <h4>{paper.title}</h4>
                <p>
                  <strong>Relevancia:</strong> {paper.relevanceScore}/10
                </p>

                {paper.methodology && (
                  <p>
                    <strong>Metodología:</strong> {paper.methodology}
                  </p>
                )}

                {paper.results && (
                  <p>
                    <strong>Resultados:</strong> {paper.results}
                  </p>
                )}

                <h5>🔍 Hallazgos Clave:</h5>
                <ul>
                  {paper.keyFindings.map((finding, fIndex) => (
                    <li key={fIndex}>{finding}</li>
                  ))}
                </ul>

                {paper.limitations && (
                  <p>
                    <strong>⚠️ Limitaciones:</strong> {paper.limitations}
                  </p>
                )}

                <p>
                  <strong>🔗 Fuente:</strong>{" "}
                  <a href={paper.url} target="_blank" rel="noopener noreferrer">
                    Ver Paper Original
                  </a>
                </p>
              </div>
            ))}
          </div>

          <div className="sources">
            <h3>📖 Fuentes Consultadas</h3>
            <ul>
              {completeResult.sources.map((source, index) => (
                <li key={index}>
                  <a href={source} target="_blank" rel="noopener noreferrer">
                    {source}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Análisis detallado */}
      {paperAnalysis && (
        <div className="paper-analysis">
          <h3>📊 Análisis Detallado: {paperAnalysis.title}</h3>
          <p>
            <strong>Puntuación de Relevancia:</strong>{" "}
            {paperAnalysis.relevanceScore}/10
          </p>
          <p>
            <strong>Resumen:</strong> {paperAnalysis.summary}
          </p>

          <h4>🔍 Hallazgos Clave:</h4>
          <ul>
            {paperAnalysis.keyFindings.map((finding, index) => (
              <li key={index}>{finding}</li>
            ))}
          </ul>

          <p>
            <strong>🔗 Fuente:</strong>{" "}
            <a
              href={paperAnalysis.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver Paper Original
            </a>
          </p>
        </div>
      )}

      {/* Estado de conexión */}
      <div className="status">
        Estado: {connected ? "✅ Conectado a Gemini" : "❌ No conectado"}
      </div>
    </div>
  );
};

export default SimpleResearchTool;
