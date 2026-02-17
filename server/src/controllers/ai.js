import { analyzeComplaint, translateToEnglish } from "../services/aiService.js";

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

    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Text is required for translation"
      });
    }

    const translated = await translateToEnglish(text);

    res.status(200).json({
      success: true,
      translated
    });

  } catch (err) {
    next(err);
  }
};
