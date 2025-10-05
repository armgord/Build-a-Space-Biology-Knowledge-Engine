/**
 * NASA Bioscience Research Dashboard - Simple Version
 * Prueba MVP para validar la idea
 */

import React, { useState } from "react";
import { SimpleNASAAPIProvider } from "./contexts/NASAAPIContext";
import SimpleResearchTool from "./components/SimpleResearchTool";
import VoiceAssistant from "./components/VoiceAssistant";
import "./App.scss";
import "./components/SimpleResearchTool.scss";
import "./components/VoiceAssistant.scss";

const App: React.FC = () => {
  const [voiceQuery, setVoiceQuery] = useState<string>("");
  const [voiceResult, setVoiceResult] = useState<any>(null);

  const handleVoiceQuery = (query: string, result: any) => {
    setVoiceQuery(query);
    setVoiceResult(result);
  };

  return (
    <SimpleNASAAPIProvider apiKey={process.env.REACT_APP_GEMINI_API_KEY || ""}>
      <div className="nasa-app">
        <div className="app-header">
          <h1>🚀 NASA Space Biology Research Assistant</h1>
          <p>🎤 Voice-Powered • 🤖 AI-Enhanced • 📊 607 Research Papers</p>
        </div>

        <VoiceAssistant onQueryResult={handleVoiceQuery} />

        <SimpleResearchTool
          initialQuery={voiceQuery}
          initialResult={voiceResult}
        />
      </div>
    </SimpleNASAAPIProvider>
  );
};

export default App;
