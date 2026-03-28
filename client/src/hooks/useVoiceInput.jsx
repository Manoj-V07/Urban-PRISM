import { useState, useRef, useCallback, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";

const WebSpeechRecognition =
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
  const [nativeSupported, setNativeSupported] = useState(false);
  const [nativePermissionGranted, setNativePermissionGranted] = useState(false);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  const onInterimRef = useRef(onInterim);
  const isNative = Capacitor.isNativePlatform();
  const supported = isNative ? nativeSupported : !!WebSpeechRecognition;

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

  // Native speech recognition setup (Capacitor)
  useEffect(() => {
    if (!isNative) return undefined;

    let disposed = false;
    let partialResultsListener = null;
    let listeningListener = null;

    const setupNativeSpeech = async () => {
      try {
        const availability = await SpeechRecognition.available();
        if (!disposed) {
          setNativeSupported(!!availability.available);
        }

        const permissions = await SpeechRecognition.checkPermissions();
        if (!disposed) {
          setNativePermissionGranted(permissions.speechRecognition === "granted");
        }

        partialResultsListener = await SpeechRecognition.addListener("partialResults", (data) => {
          const text = data?.matches?.[0] || "";
          if (!text) return;

          setInterim(text);
          setTranscript(text);
          onInterimRef.current?.(text);
          onResultRef.current?.(text);
        });

        listeningListener = await SpeechRecognition.addListener("listeningState", (data) => {
          const isListening = !!data?.status;
          setListening(isListening);
          if (!isListening) {
            setInterim("");
          }
        });
      } catch (err) {
        console.warn("[VoiceInput] native setup error:", err);
        if (!disposed) {
          setNativeSupported(false);
        }
      }
    };

    setupNativeSpeech();

    return () => {
      disposed = true;
      try {
        partialResultsListener?.remove?.();
        listeningListener?.remove?.();
      } catch {
        // ignore cleanup failures
      }
    };
  }, [isNative]);

  const start = useCallback(() => {
    if (isNative) {
      const startNativeRecognition = async () => {
        try {
          if (!nativePermissionGranted) {
            const permission = await SpeechRecognition.requestPermissions();
            const granted = permission.speechRecognition === "granted";
            setNativePermissionGranted(granted);
            if (!granted) return;
          }

          setTranscript("");
          setInterim("");
          setListening(true);

          await SpeechRecognition.start({
            language: lang,
            maxResults: 1,
            prompt: "Speak now",
            partialResults: true,
            popup: false,
          });
        } catch (err) {
          console.warn("[VoiceInput] native start error:", err);
          setListening(false);
        }
      };

      startNativeRecognition();
      return;
    }

    if (!WebSpeechRecognition) return;

    const recognition = new WebSpeechRecognition();
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
      console.warn("[VoiceInput] web error:", event.error);
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
  }, [continuous, isNative, lang, nativePermissionGranted]);

  const stop = useCallback(() => {
    if (isNative) {
      SpeechRecognition.stop().catch(() => {
        // ignore native stop failures
      });
      setListening(false);
      setInterim("");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [isNative]);

  return { listening, supported, start, stop, transcript, interim };
};

export default useVoiceInput;
