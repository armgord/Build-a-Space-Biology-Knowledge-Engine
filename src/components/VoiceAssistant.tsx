/**
 * Voice Assistant Component for NASA Research Tool
 * Integrates speech recognition + ElevenLabs TTS
 */

import React, { useState, useRef, useEffect } from "react";
import { useSimpleNASAAPIContext } from "../contexts/NASAAPIContext";

// Importamos los datos del JSON
import nasaArticles from "../data/nasa_articles_context.json";

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceAssistantProps {
  onQueryResult?: (query: string, result: any) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onQueryResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");

  const recognitionRef = useRef<any>(null);
  const { client, connected } = useSimpleNASAAPIContext();

  // Initialize Speech Recognition
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onstart = () => {
          setIsListening(true);
          setError("");
        };

        recognitionRef.current.onresult = (event: any) => {
          const speechResult = event.results[0][0].transcript;
          setTranscript(speechResult);
          handleVoiceQuery(speechResult);
        };

        recognitionRef.current.onerror = (event: any) => {
          setError(`Speech recognition error: ${event.error}`);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    } else {
      setError("Speech recognition not supported in this browser");
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      setResponse("");
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleVoiceQuery = async (query: string) => {
    if (!connected || !query.trim()) return;

    setIsProcessing(true);
    setError("");

    try {
      console.log("🎤 Voice query:", query);

      // Use the complete research method
      const allPapers = (nasaArticles as any).articles;
      const result = await client.completeResearch(query, allPapers);

      // Extract a concise response for TTS
      const conciseResponse = `Based on ${
        result.relevantPapers?.length || 0
      } research papers, ${result.synthesizedAnswer}`;

      setResponse(conciseResponse);

      // Callback to parent component
      if (onQueryResult) {
        onQueryResult(query, result);
      }

      // Speak the response
      await speakResponse(conciseResponse);
    } catch (error) {
      console.error("❌ Voice query error:", error);
      setError("Failed to process voice query");
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = async (text: string) => {
    setIsSpeaking(true);

    try {
      // Option 1: Use Web Speech API (built-in, limited voices)
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend = () => {
          setIsSpeaking(false);
        };

        utterance.onerror = () => {
          setIsSpeaking(false);
        };

        speechSynthesis.speak(utterance);
      }

      // TODO: Option 2: ElevenLabs API for better quality
      // await speakWithElevenLabs(text);
    } catch (error) {
      console.error("❌ TTS error:", error);
      setIsSpeaking(false);
    }
  };

  // TODO: Implement ElevenLabs integration
  const speakWithElevenLabs = async (text: string) => {
    // ElevenLabs API implementation here
    // Need API key and voice selection
  };

  return (
    <div className="voice-assistant">
      <div className="voice-controls">
        <h3>🎤 NASA Voice Assistant</h3>

        <div className="voice-status">
          {isListening && (
            <div className="listening-indicator">
              🔴 Listening... Speak your question
            </div>
          )}

          {isProcessing && (
            <div className="processing-indicator">
              🔄 Processing your query...
            </div>
          )}

          {isSpeaking && (
            <div className="speaking-indicator">🔊 Speaking response...</div>
          )}
        </div>

        <div className="voice-buttons">
          <button
            onClick={startListening}
            disabled={isListening || isProcessing || !connected}
            className={`voice-button ${isListening ? "listening" : ""}`}
          >
            {isListening ? "🔴 Listening..." : "🎤 Ask NASA"}
          </button>

          {isListening && (
            <button onClick={stopListening} className="stop-button">
              ⏹️ Stop
            </button>
          )}
        </div>

        {transcript && (
          <div className="transcript">
            <h4>You said:</h4>
            <p>"{transcript}"</p>
          </div>
        )}

        {response && (
          <div className="response">
            <h4>NASA Assistant:</h4>
            <p>{response.substring(0, 300)}...</p>
          </div>
        )}

        {error && (
          <div className="error">
            <p>❌ {error}</p>
          </div>
        )}
      </div>

      <div className="voice-examples">
        <h4>💡 Try saying:</h4>
        <ul>
          <li>"What are the effects of microgravity on bone loss?"</li>
          <li>"How does space radiation affect astronauts?"</li>
          <li>"Tell me about cardiovascular changes in space"</li>
          <li>"What are the latest findings on muscle atrophy?"</li>
        </ul>
      </div>
    </div>
  );
};

export default VoiceAssistant;
