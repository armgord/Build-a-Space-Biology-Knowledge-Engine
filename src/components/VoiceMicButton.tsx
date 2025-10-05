/**
 * Voice Microphone Button - Simple speech-to-text like Gemini
 * Integrates directly into input field
 */

import React, { useState, useRef, useEffect } from "react";

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Íconos SVG simples y limpios - Creados desde cero
const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Cápsula del micrófono */}
    <rect x="9" y="2" width="6" height="11" rx="3" fill="currentColor" />
    {/* Soporte */}
    <path
      d="M12 18V22M8 22H16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Arco del micrófono */}
    <path
      d="M19 10V12C19 16.42 15.42 20 11 20H13C17.42 20 21 16.42 21 12V10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M5 10V12C5 16.42 8.58 20 13 20H11C6.58 20 3 16.42 3 12V10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const MicOffIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Micrófono deshabilitado */}
    <rect
      x="9"
      y="2"
      width="6"
      height="11"
      rx="3"
      fill="currentColor"
      opacity="0.3"
    />
    <path
      d="M12 18V22M8 22H16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.3"
    />
    {/* Línea diagonal de "deshabilitado" */}
    <path
      d="M6 6L18 18"
      stroke="#ef4444"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const RecordingIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Círculo rojo pulsante más simple */}
    <circle cx="12" cy="12" r="6" fill="#ef4444" className="recording-pulse" />
    <circle cx="12" cy="12" r="2" fill="white" />
  </svg>
);

interface VoiceMicButtonProps {
  onVoiceInput: (text: string) => void;
  disabled?: boolean;
}

const VoiceMicButton: React.FC<VoiceMicButtonProps> = ({
  onVoiceInput,
  disabled = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    console.log("🎤 Inicializando reconocimiento de voz...");

    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "es-ES"; // Cambiado a español
        recognitionRef.current.maxAlternatives = 1;

        recognitionRef.current.onstart = () => {
          console.log("🎤 Reconocimiento iniciado");
          setIsListening(true);
          setError("");
        };

        recognitionRef.current.onresult = (event: any) => {
          console.log("🎤 Resultado recibido:", event.results);
          const transcript = event.results[0][0].transcript;
          console.log("📝 Texto reconocido:", transcript);
          onVoiceInput(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("❌ Error en reconocimiento de voz:", event.error);
          let errorMessage = "";
          switch (event.error) {
            case "no-speech":
              errorMessage = "No se detectó voz";
              break;
            case "audio-capture":
              errorMessage = "No se puede acceder al micrófono";
              break;
            case "not-allowed":
              errorMessage = "Permiso de micrófono denegado";
              break;
            case "network":
              errorMessage = "Error de red";
              break;
            default:
              errorMessage = `Error: ${event.error}`;
          }
          setError(errorMessage);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          console.log("🎤 Reconocimiento terminado");
          setIsListening(false);
        };
      }
    } else {
      console.error("❌ Speech Recognition no soportado en este navegador");
      setError("Speech Recognition no soportado");
    }
  }, [onVoiceInput]);

  const startListening = () => {
    if (recognitionRef.current && !isListening && !disabled) {
      setError("");
      console.log("🎤 Iniciando escucha...");
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("❌ Error al iniciar reconocimiento:", error);
        setError("No se pudo iniciar el reconocimiento");
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Verificar soporte del navegador
  const hasSupport =
    "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

  return (
    <div className="voice-mic-container">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || !hasSupport}
        className={`voice-mic-button ${isListening ? "listening" : ""} ${
          disabled || !hasSupport ? "disabled" : ""
        }`}
        title={
          !hasSupport
            ? "Reconocimiento de voz no soportado"
            : isListening
            ? "Haz clic para parar"
            : "Haz clic para hablar"
        }
      >
        {!hasSupport ? (
          <MicOffIcon className="mic-icon" />
        ) : isListening ? (
          <RecordingIcon className="mic-icon" />
        ) : (
          <MicIcon className="mic-icon" />
        )}
      </button>

      {error && <div className="voice-error-tooltip">{error}</div>}

      {isListening && (
        <div className="voice-status-tooltip">🎤 Escuchando...</div>
      )}
    </div>
  );
};

export default VoiceMicButton;
