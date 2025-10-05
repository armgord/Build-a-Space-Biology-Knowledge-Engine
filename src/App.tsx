/**
 * NASA Bioscience Research Dashboard - Simple Version
 * Prueba MVP para validar la idea
 */

import React from "react";
import { SimpleNASAAPIProvider } from "./contexts/NASAAPIContext";
import SimpleResearchTool from "./components/SimpleResearchTool";
import "./App.scss";
import "./components/SimpleResearchTool.scss";

const App: React.FC = () => {
  return (
    <SimpleNASAAPIProvider apiKey={process.env.REACT_APP_GEMINI_API_KEY || ""}>
      <div className="nasa-app">
        <SimpleResearchTool />
      </div>
    </SimpleNASAAPIProvider>
  );
};

export default App;
