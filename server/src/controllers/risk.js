import { runRiskEngine } from "../services/riskEngine.js";

export const generateRisk = async (req, res) => {

  const results = await runRiskEngine();

  res.json({
    generated: results.length
  });
};
