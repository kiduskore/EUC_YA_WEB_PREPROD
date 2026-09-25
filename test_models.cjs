const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

async function test(modelName) {
  try {
    const res = await ai.models.generateContent({
      model: modelName,
      contents: "hello"
    });
    console.log(`[${modelName}]: Success`);
  } catch (err) {
    console.log(`[${modelName}]: Error - ${err.message}`);
  }
}

async function run() {
  await test("gemini-3.8-flash");
  await test("gemini-3.1-flash-lite");
  await test("gemini-2.5-flash");
  await test("gemini-1.5-flash-8b");
  await test("gemini-1.5-flash");
}
run();
