import Groq from "groq-sdk";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

// Lazy-init: Groq client is created on first use,
// AFTER dotenv has loaded the env vars.
let groq;

function getGroq() {
  if (!groq) {
    const apiKey = (process.env.GROQ_API_KEY || "").trim();

    if (!apiKey) {
      throw new Error("GROQ API key is not configured");
    }

    groq = new Groq({ apiKey });
  }
  return groq;
}

let genAI;

function getGenAI() {
  if (!genAI) {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();

    if (!apiKey) {
      throw new Error("Gemini API key is not configured");
    }

    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

const generateWithGemini = async (prompt) => {
  const response = await getGenAI().models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
  });

  return (response.text || "").trim();
};


/**
 * Smart Complaint Analyzer
 */
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

  let output;

  try {
    const completion = await getGroq().chat.completions.create({

      model: "llama-3.1-8b-instant",

      messages: [
        { role: "user", content: prompt }
      ],

      temperature: 0.2
    });

    output = completion.choices[0].message.content;
  } catch {
    output = await generateWithGemini(prompt);
  }

  const jsonMatch = output.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Invalid AI response");
  }

  return JSON.parse(jsonMatch[0]);
};



/**
 * Translation (Any → English)
 */
export const translateToEnglish = async (text) => {

  const prompt = `
Translate the following text to clear English.
Return ONLY the translated sentence.

Text:
"${text}"
`;

  try {
    const completion = await getGroq().chat.completions.create({

      model: "llama-3.1-8b-instant",

      messages: [
        { role: "user", content: prompt }
      ],

      temperature: 0
    });

    return completion.choices[0].message.content.trim();
  } catch {
    return await generateWithGemini(prompt);
  }
};



/**
 * Chatbot Assistant
 */
export const chatAssistant = async (message) => {

const prompt = `
You are the official AI assistant for the Urban-Prism Smart Governance Platform.

About the system:
Urban-Prism is a web-based urban grievance and infrastructure management system used by citizens and administrators to report, analyze, and resolve public infrastructure issues.

--------------------------------------------------
USER (CITIZEN) WORKFLOW
--------------------------------------------------

1. Registration and Login
- Citizens register using name, email, and password
- They login using JWT authentication

2. Submitting a Grievance
- User selects "Submit Grievance"
- Uploads an image of the problem
- Selects location using map or GPS coordinates
- Enters complaint description
- AI automatically analyzes the text
- AI predicts category, severity, and summary
- Grievance is saved with status "Pending"

3. Complaint Processing
- System groups nearby complaints using spatial clustering
- Complaints are mapped to nearest infrastructure asset
- Risk score is calculated automatically

4. Tracking Status
- Users can view all submitted complaints
- Status changes: Pending → In Progress → Resolved / Rejected
- Users receive email notifications on updates

5. Viewing Dashboard
- Users can see complaint history
- View cluster details
- View risk information

--------------------------------------------------
ADMIN WORKFLOW
--------------------------------------------------

1. Admin Login
- Admins login with special role access

2. Asset Management
- Admins add and update infrastructure assets
- Assets include location, service radius, maintenance date, and repair cost

3. Complaint Monitoring
- View all grievances and clusters
- Filter by district, ward, category, and status
- View mapped assets

4. Risk Management
- System calculates risk score using:
  severity, complaint volume, recency, maintenance age, and repair cost
- Assets are prioritized based on risk

5. Resolution Process
- Admin assigns maintenance tasks
- Updates grievance status
- Marks complaints as resolved
- Users are notified by email

6. Analytics and Reports
- View district-wise and ward-wise reports
- Monitor complaint trends
- Identify high-risk assets

--------------------------------------------------
AI CAPABILITIES
--------------------------------------------------

- AI analyzes complaint text
- AI predicts category and severity
- AI generates complaint summary
- AI translates multilingual complaints to English
- AI chatbot provides guidance to users and admins

--------------------------------------------------
SYSTEM RULES
--------------------------------------------------

- Answer ONLY using these system features
- Do NOT invent websites, phone numbers, or links
- Do NOT mention external services
- Do NOT give false information
- Be polite, professional, and clear
- Keep answers concise
- If unsure, say "Please contact system administrator"

--------------------------------------------------
USER QUESTION
--------------------------------------------------

"${message}"

Provide a helpful response based only on this system.
`;

  try {
    const completion = await getGroq().chat.completions.create({

      model: "llama-3.1-8b-instant",

      messages: [
        { role: "user", content: prompt }
      ],

      temperature: 0.3
    });

    return completion.choices[0].message.content.trim();
  } catch {
    return await generateWithGemini(prompt);
  }
};

export const verifyComplaintImage = async (imagePath, text) => {

  // Read image
  const imageBase64 = fs.readFileSync(imagePath, {
    encoding: "base64"
  });

  const prompt = `
Check whether this image matches the complaint text.

Complaint:
"${text}"

Reply ONLY in JSON:

{
  "match": true or false,
  "reason": "short explanation"
}
`;

  const response = await getGenAI().models.generateContent({

    model: "gemini-2.5-flash",

    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64
            }
          }
        ]
      }
    ]
  });

  const output = response.text;

  const jsonMatch = output.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Invalid Gemini response");
  }

  return JSON.parse(jsonMatch[0]);
};
