/**
 * Herramienta Simple de Investigación NASA
 * Rediseñada con interfaz tipo Consensus
 */

import React, { useState } from "react";
import { useSimpleNASAAPIContext } from "../contexts/NASAAPIContext";
import VoiceMicButton from "./VoiceMicButton";
import {
  NASAPaper,
  SearchResult,
  PaperAnalysis,
  CompleteResearchResult,
} from "../types/nasa-types";

// Importamos los datos del JSON
import nasaArticles from "../data/nasa_articles_context.json";

// Importamos los estilos tipo Consensus
import "./consensus-styles.scss";

interface SimpleResearchToolProps {
  initialQuery?: string;
  initialResult?: any;
}

const SimpleResearchTool: React.FC<SimpleResearchToolProps> = ({
  initialQuery = "",
  initialResult = null,
}) => {
  const [userQuery, setUserQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<NASAPaper | null>(null);
  const [paperAnalysis, setPaperAnalysis] = useState<PaperAnalysis | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Estado para investigación completa automatizada
  const [completeResult, setCompleteResult] =
    useState<CompleteResearchResult | null>(null);
  const [isResearching, setIsResearching] = useState(false);

  // Estado para el tipo de búsqueda
  const [searchType, setSearchType] = useState<"quick" | "complete">(
    "complete"
  );

  const { client, connected } = useSimpleNASAAPIContext();

  // Sync with voice assistant results
  React.useEffect(() => {
    if (initialQuery && initialQuery !== userQuery) {
      setUserQuery(initialQuery);
    }
    if (initialResult && initialResult !== completeResult) {
      setCompleteResult(initialResult);

      // Also create search results for display
      if (
        initialResult.relevantPapers &&
        initialResult.relevantPapers.length > 0
      ) {
        const allPapers = (nasaArticles as any).articles;
        const foundPapers = initialResult.relevantPapers
          .map((analyzedPaper: any) => {
            return allPapers.find(
              (originalPaper: any) =>
                originalPaper.title === analyzedPaper.title
            );
          })
          .filter(Boolean);

        setSearchResults({
          relevantPapers: foundPapers,
          searchQuery: initialQuery,
          summary: initialResult.searchSummary || "Results from voice query",
        });
      }
    }
  }, [initialQuery, initialResult]);

  // Función unificada para submit
  const handleSubmit = () => {
    if (!userQuery.trim() || !connected || isSearching || isResearching) return;

    if (searchType === "complete") {
      handleCompleteResearch();
    } else {
      handleSearch();
    }
  };

  // Investigación completa automatizada
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

      // Establecer AMBOS resultados: completo Y búsqueda simple
      setCompleteResult(result);

      // También crear resultados de búsqueda para mostrar papers encontrados
      if (result.relevantPapers && result.relevantPapers.length > 0) {
        // Encontrar los papers originales del JSON que coincidan
        const foundPapers = result.relevantPapers
          .map((analyzedPaper: any) => {
            return allPapers.find(
              (originalPaper: any) =>
                originalPaper.title === analyzedPaper.title
            );
          })
          .filter(Boolean); // Remover nulls

        setSearchResults({
          relevantPapers: foundPapers,
          searchQuery: userQuery,
          summary:
            result.searchSummary ||
            "Papers encontrados y analizados automáticamente",
        });
      }

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
        Abstract: ${paper.abstract.substring(0, 300)}
        ---`
          )
          .join("")}

        Responde con un JSON que contenga:
        {
          "relevantPapers": [
            {
              "title": "título exacto del paper",
              "year": año,
              "authors": ["autor1", "autor2"],
              "abstract": "abstract del paper",
              "keywords": ["keyword1", "keyword2"],
              "link": "URL si está disponible"
            }
          ],
          "searchQuery": "${userQuery}"
        }
        
        Selecciona máximo 5 papers más relevantes.
      `;

      const result = await client.simpleQuery(searchPrompt);

      if (result && result.relevantPapers) {
        setSearchResults(result);
        console.log("✅ Papers encontrados:", result.relevantPapers.length);
      } else {
        console.error("❌ No se encontraron papers relevantes");
        alert("No se encontraron papers relevantes");
      }
    } catch (error) {
      console.error("❌ Error en búsqueda:", error);
      alert("Error en la búsqueda. Revisa la consola.");
    } finally {
      setIsSearching(false);
    }
  };

  // Paso 2: Analizar paper específico con Gemini
  const handleAnalyzePaper = async (paper: NASAPaper) => {
    setIsAnalyzing(true);
    setSelectedPaper(paper);
    setPaperAnalysis(null);

    try {
      console.log("🔬 Analizando paper:", paper.title);

      const analysisPrompt = `
        Analiza este paper de NASA en detalle:

        Título: ${paper.title}
        Año: ${paper.year}
        Autores: ${paper.authors.join(", ")}
        Abstract: ${paper.abstract}
        Keywords: ${paper.keywords.join(", ")}
        
        Consulta del usuario: "${userQuery}"

        Responde con un JSON que contenga:
        {
          "title": "${paper.title}",
          "url": "${paper.link || ""}",
          "relevanceScore": puntuación del 1-10,
          "summary": "resumen conciso del paper",
          "keyFindings": ["hallazgo 1", "hallazgo 2", "hallazgo 3"],
          "methodology": "metodología utilizada",
          "implications": "implicaciones para la pregunta del usuario"
        }
      `;

      const result = await client.analyzeURL(paper.link || "", analysisPrompt);

      if (result) {
        setPaperAnalysis(result);
        console.log("✅ Análisis completado:", result);
      } else {
        console.error("❌ No se pudo analizar el paper");
        alert("No se pudo analizar el paper");
      }
    } catch (error) {
      console.error("❌ Error en análisis:", error);
      alert("Error al analizar paper. Revisa la consola.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="consensus-research-tool">
      {/* Header centrado tipo Consensus */}
      <div className="consensus-header">
        <div className="consensus-logo">
          <span className="logo-icon">🚀</span>
          <span className="logo-text">Space Bio Searcher</span>
        </div>
        <h1 className="consensus-title">Research starts here</h1>
      </div>

      {/* Input principal tipo Consensus */}
      <div className="consensus-search-container">
        <div className="consensus-input-wrapper">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Ask the research..."
            className="consensus-input"
            onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
          />

          {/* Controles dentro del input */}
          <div className="consensus-controls">
            {/* Selector de tipo de búsqueda */}
            <div className="search-type-selector">
              <button
                className={`search-type-option ${
                  searchType === "quick" ? "active" : ""
                }`}
                onClick={() => setSearchType("quick")}
              >
                <span className="option-icon">📄</span>
                <span>Quick</span>
              </button>
              <button
                className={`search-type-option ${
                  searchType === "complete" ? "active" : ""
                }`}
                onClick={() => setSearchType("complete")}
              >
                <span className="option-icon">🔬</span>
                <span>All</span>
              </button>
            </div>

            {/* Voice button */}
            <VoiceMicButton
              onVoiceInput={setUserQuery}
              disabled={isSearching || isResearching || !connected}
            />

            {/* Submit arrow button */}
            <button
              className="submit-arrow-button"
              onClick={handleSubmit}
              disabled={
                isSearching || isResearching || !connected || !userQuery.trim()
              }
              aria-label={`${
                searchType === "complete" ? "Complete Research" : "Quick Search"
              }`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Action buttons tipo Consensus */}
        <div className="consensus-action-buttons">
          <button className="consensus-action-btn">
            <span className="action-icon">🔍</span>
            <span>Try a Deep Search</span>
          </button>
          <button className="consensus-action-btn">
            <span className="action-icon">📝</span>
            <span>Draft an outline</span>
          </button>
          <button className="consensus-action-btn">
            <span className="action-icon">📊</span>
            <span>Create a table</span>
          </button>
          <button className="consensus-action-btn active">
            <span className="action-icon">📈</span>
            <span>Try the Consensus Meter</span>
          </button>
        </div>

        {/* Sugerencia tipo Consensus */}
        <div className="consensus-suggestion">
          <span className="suggestion-icon">💡</span>
          <span>TRY ASKING ABOUT...</span>
        </div>
      </div>

      {/* Resultados con estilo Consensus */}
      {completeResult && (
        <div className="research-results-section">
          <h3>Research Results</h3>

          <div className="result-content">
            {completeResult.synthesizedAnswer}
          </div>

          <div className="papers-grid">
            {completeResult.relevantPapers.map((paper, index) => (
              <div key={index} className="paper-card">
                <div className="paper-title">
                  [{index + 1}] {paper.title}
                </div>
                <div className="paper-authors">
                  {paper.authors ? paper.authors.join(", ") : "NASA Research"}
                </div>
                <div className="paper-year">{paper.year || "Recent"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {searchResults && !completeResult && (
        <div className="research-results-section">
          <h3>Quick Search Results</h3>

          <div className="papers-grid">
            {searchResults.relevantPapers.map((paper, index) => (
              <div key={index} className="paper-card">
                <div className="paper-title">{paper.title}</div>
                <div className="paper-authors">{paper.authors.join(", ")}</div>
                <div className="paper-year">{paper.year}</div>
                <button
                  onClick={() => handleAnalyzePaper(paper)}
                  disabled={isAnalyzing}
                  className="analyze-button"
                >
                  {isAnalyzing && selectedPaper?.title === paper.title
                    ? "Analyzing..."
                    : "Analyze Paper"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Análisis detallado individual (solo para búsqueda rápida) */}
      {paperAnalysis && (
        <div className="research-results-section">
          <h3>Paper Analysis: {paperAnalysis.title}</h3>

          <div className="result-content">
            <p>
              <strong>Relevance Score:</strong> {paperAnalysis.relevanceScore}
              /10
            </p>
            <p>
              <strong>Summary:</strong> {paperAnalysis.summary}
            </p>
          </div>

          <div className="key-findings">
            <h4>Key Findings:</h4>
            <ul>
              {paperAnalysis.keyFindings.map(
                (finding: string, index: number) => (
                  <li key={index}>{finding}</li>
                )
              )}
            </ul>
          </div>

          <p>
            <a
              href={paperAnalysis.url}
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
            >
              View Original Paper →
            </a>
          </p>
        </div>
      )}

      {/* Estado de conexión minimalista */}
      {!connected && (
        <div className="consensus-suggestion">
          <span className="suggestion-icon">⚠️</span>
          <span>CONNECTION STATUS: DISCONNECTED</span>
        </div>
      )}
    </div>
  );
};

export default SimpleResearchTool;
