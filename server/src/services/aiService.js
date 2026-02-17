import Groq from "groq-sdk";

let groq;

function getGroqClient() {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

export const analyzeComplaint = async (text) => {

  const prompt = `
You are an urban grievance analysis AI.

Analyze the complaint and return ONLY JSON.

Complaint:
"${text}"

Return:

{
  "category": "Road Damage | Streetlight Failure | Drain Blockage | Water Leakage | Footpath Damage | Other",
  "severity": "Low | Medium | High",
  "summary": "short one line summary"
}
`;

  const completion = await getGroqClient().chat.completions.create({

    model: "llama-3.1-8b-instant",

    messages: [
      { role: "user", content: prompt }
    ],

    temperature: 0.2
  });

  const output = completion.choices[0].message.content;

  const jsonMatch = output.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Invalid AI response");
  }

  return JSON.parse(jsonMatch[0]);
};


export const translateToEnglish = async (text) => {

  const prompt = `
Translate the following text to clear English.
Return ONLY the translated sentence.

Text:
"${text}"
`;

  const completion = await groq.chat.completions.create({

    model: "llama-3.1-8b-instant",

    messages: [
      { role: "user", content: prompt }
    ],

    temperature: 0
  });

  return completion.choices[0].message.content.trim();
};
