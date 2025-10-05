/**
 * NASA Bioscience Research Dashboard - Simple Version
 * Prueba MVP para validar la idea
 */

import React, { useState } from "react";
import { SimpleNASAAPIProvider } from "./contexts/NASAAPIContext";
import SimpleResearchTool from "./components/SimpleResearchTool";
import "./App.scss";
import "./components/SimpleResearchTool.scss";

const App: React.FC = () => {
  const [voiceQuery, setVoiceQuery] = useState<string>("");
  const [voiceResult, setVoiceResult] = useState<any>(null);

  const handleVoiceQuery = (query: string, result: any) => {
    setVoiceQuery(query);
    setVoiceResult(result);
  };

  return (
    <SimpleNASAAPIProvider apiKey={process.env.REACT_APP_GEMINI_API_KEY || ""}>
      <SimpleResearchTool
        initialQuery={voiceQuery}
        initialResult={voiceResult}
      />
    </SimpleNASAAPIProvider>
  );
};

export default App;
