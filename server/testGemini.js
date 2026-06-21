import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import { GoogleGenAI } from '@google/genai';

(async () => {
  try {
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const res = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: 'Hello from local test' }]
    });

    console.log('OK_RESPONSE_TEXT_START');
    console.log((res.text || '').slice(0,1000));
    console.log('OK_RESPONSE_TEXT_END');
  } catch (err) {
    console.error('ERROR_TYPE:', err?.name || typeof err);
    if (err?.message) console.error('ERROR_MESSAGE:', err.message);
    try {
      if (err?.response) console.error('ERROR_RESPONSE_STATUS:', err.response.status, 'DATA_SNIPPET:', JSON.stringify(err.response.data).slice(0,1000));
    } catch (e) {
      // ignore
    }
    if (err?.status) console.error('ERROR_STATUS_PROP:', err.status);
    process.exit(1);
  }
})();
