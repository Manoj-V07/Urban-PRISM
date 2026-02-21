import { useState, useRef, useCallback, useEffect } from "react";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

/**
 * Hook for speech-to-text voice input.
 *
 * @param {Object}   opts
 * @param {string}   opts.lang        – BCP-47 language tag (default "en-IN")
 * @param {boolean}  opts.continuous   – keep listening until stopped (default true)
 * @param {Function} opts.onResult     – called with the final transcript string
 * @param {Function} opts.onInterim    – called with interim (partial) transcript
 *
 * @returns {{ listening, supported, start, stop, transcript, interim }}
 */
const useVoiceInput = ({
  lang = "en-IN",
  continuous = true,
  onResult,
  onInterim,
} = {}) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  const onInterimRef = useRef(onInterim);
  const supported = !!SpeechRecognition;

  // Keep callback refs up to date
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  useEffect(() => {
    onInterimRef.current = onInterim;
  }, [onInterim]);

  // Tear down on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = true;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + " ";
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) {
        setTranscript((prev) => {
          const updated = prev + finalText;
          onResultRef.current?.(updated);
          return updated;
        });
      }

      setInterim(interimText);
      onInterimRef.current?.(interimText);
    };

    recognition.onerror = (event) => {
      console.warn("[VoiceInput] error:", event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = recognition;
    setTranscript("");
    setInterim("");
    recognition.start();
  }, [lang, continuous]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { listening, supported, start, stop, transcript, interim };
};

export default useVoiceInput;
