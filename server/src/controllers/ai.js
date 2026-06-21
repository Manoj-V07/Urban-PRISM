import {
  analyzeComplaint,
  translateBatchToLanguage,
  translateToLanguage,
  chatAssistant,
  extractGpsFromImageText,
} from "../services/aiService.js";

export const analyzeGrievanceAI = async (req, res, next) => {

  try {

    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Complaint text is required"
      });
    }

    const result = await analyzeComplaint(text);

    res.status(200).json({
      success: true,
      ai: result
    });

  } catch (err) {
    next(err);
  }
};


export const translateAI = async (req, res, next) => {

  try {

    const { text, texts, targetLang = "en" } = req.body;

    if (!text && !Array.isArray(texts)) {
      return res.status(400).json({
        success: false,
        message: "text or texts[] is required for translation"
      });
    }

    if (Array.isArray(texts)) {
      const clean = texts
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 100);

      const translations = await translateBatchToLanguage(clean, targetLang);
      return res.status(200).json({
        success: true,
        targetLang,
        translations,
      });
    }

    const translated = await translateToLanguage(text, targetLang);

    res.status(200).json({
      success: true,
      targetLang,
      translated
    });

  } catch (err) {
    next(err);
  }
};

export const chatAI = async (req, res, next) => {

  try {

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message required"
      });
    }

    const reply = await chatAssistant(message);

    res.status(200).json({
      success: true,
      reply
    });

  } catch (err) {
    next(err);
  }
};

export const extractCoordinatesAI = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required for coordinate extraction"
      });
    }

    const result = await extractGpsFromImageText(req.file.path);

    res.status(200).json({
      success: true,
      extracted: result.extracted,
      latitude: result.latitude,
      longitude: result.longitude
    });

  } catch (err) {
    console.error("Visual coordinate extraction failed on backend:", err.message);
    const isRateLimit = err?.status === 429 || 
                        String(err?.message || "").includes("Quota exceeded") || 
                        String(err?.message || "").includes("RESOURCE_EXHAUSTED");
    if (isRateLimit) {
      return res.status(429).json({
        success: false,
        message: "Gemini API Quota Exceeded (429 Rate Limit). The system cannot process visual watermarks right now. Please configure a higher quota key or upload an image with intact binary EXIF metadata."
      });
    }
    next(err);
  }
};
