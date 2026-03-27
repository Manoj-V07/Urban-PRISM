import {
  analyzeComplaint,
  translateBatchToLanguage,
  translateToLanguage,
  chatAssistant,
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
