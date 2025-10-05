/**
 * TypeScript types for NASA Bioscience Research Dashboard - Simple Version
 */

// Datos del JSON de NASA articles
export interface NASAPaper {
  title: string;
  year: string;
  keywords: string[];
  authors: string[];
  abstract: string;
  link: string;
}

// Resultado de búsqueda simple
export interface SearchResult {
  relevantPapers: NASAPaper[];
  searchQuery: string;
  summary: string;
}

// Análisis de un paper específico
export interface PaperAnalysis {
  title: string;
  url: string;
  keyFindings: string[];
  relevanceScore: number;
  summary: string;
  methodology?: string;
  results?: string;
  limitations?: string;
}

export interface CompleteResearchResult {
  relevantPapers: PaperAnalysis[];
  synthesizedAnswer: string;
  keyInsights: string[];
  recommendations: string[];
  confidence: number;
  sources: string[];
}
