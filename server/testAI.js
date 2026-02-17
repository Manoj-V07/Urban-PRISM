import dotenv from "dotenv";
dotenv.config();

import { analyzeComplaint } from "./src/services/aiService.js";

const test = async () => {

  console.log("KEY:", process.env.GROQ_API_KEY); 
  
  const res = await analyzeComplaint(
    "Streetlight broken near bus stop"
  );

  console.log(res);
};

test();
