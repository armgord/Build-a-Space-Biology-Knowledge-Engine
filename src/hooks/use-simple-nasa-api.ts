/**
 * Hook Simple para NASA API - Solo lo esencial para la prueba MVP
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { SimpleGeminiHTTPClient } from "../lib/simple-gemini-client";

export type SimpleNASAAPIConnection = {
  apiKey: string;
};

export type UseSimpleNASAAPIResults = {
  client: SimpleGeminiHTTPClient;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isProcessing: boolean;
};

export function useSimpleNASAAPI({
  apiKey,
}: SimpleNASAAPIConnection): UseSimpleNASAAPIResults {
  const client = useMemo(() => new SimpleGeminiHTTPClient(apiKey), [apiKey]);

  const [connected, setConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const connect = useCallback(async () => {
    console.log("🚀 Conectando a Gemini API...");
    console.log("🔑 API Key disponible:", apiKey ? "SÍ" : "NO");
    console.log(
      "🔑 API Key primeros caracteres:",
      apiKey?.substring(0, 10) + "..."
    );

    if (!apiKey || apiKey.trim() === "") {
      console.error("❌ API Key no encontrado");
      setConnected(false);
      return;
    }

    try {
      setIsProcessing(true);
      // Test simple para verificar que el API key funciona
      await client.simpleQuery("Responde solo con: 'Conexión exitosa'");
      setConnected(true);
      console.log("✅ Conectado a Gemini API");
    } catch (error) {
      console.error("❌ Error conectando a Gemini:", error);
      setConnected(false);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [client, apiKey]);

  const disconnect = useCallback(async () => {
    console.log("🛑 Desconectando de Gemini API");
    setConnected(false);
    setIsProcessing(false);
  }, []);

  // 🚀 AUTO-CONECTAR cuando el hook se monta
  useEffect(() => {
    if (apiKey && !connected && !isProcessing) {
      console.log("🔄 Auto-conectando al montar el hook...");
      connect().catch((error) => {
        console.error("❌ Auto-conexión falló:", error);
      });
    }
  }, [apiKey, connected, isProcessing, connect]);

  return {
    client,
    connected,
    connect,
    disconnect,
    isProcessing,
  };
}
