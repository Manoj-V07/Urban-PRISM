import { runRiskEngine } from "../services/riskEngine.js";

export const generateRisk = async (req, res, next) => {
  try {
    const results = await runRiskEngine();

    res.json({
      generated: results.length,
      results
    });
  } catch (err) {
    next(err);
  }
};
