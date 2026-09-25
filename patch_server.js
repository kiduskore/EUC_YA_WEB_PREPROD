const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

// Add import
if (!server.includes("import { GoogleGenAI }")) {
  server = server.replace("import helmet from 'helmet';", "import helmet from 'helmet';\nimport { GoogleGenAI } from '@google/genai';");
}

// Add ai instance and endpoint
const endpointCode = `
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
} catch (e) {
  console.error("Failed to initialize GoogleGenAI", e);
}

const chatSessions = new Map<string, any>();

app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    if (!ai) {
      return res.status(500).json({ error: 'Gemini API not configured' });
    }
    const sessionId = req.session.id || req.ip;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!chatSessions.has(sessionId)) {
      chatSessions.set(sessionId, ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: "You are a helpful and welcoming assistant for the EUCMD Young Adults ministry. You answer questions about faith, the community, leadership, and discipleship in a friendly, encouraging, and supportive tone.",
        }
      }));
    }
    
    const chat = chatSessions.get(sessionId);
    const response = await chat.sendMessage({ message });
    
    res.json({ text: response.text });
  } catch (err: any) {
    console.error('Chat API Error:', err);
    res.status(500).json({ error: err.message || 'Failed to process chat message' });
  }
});

// Diagnostic endpoint for SMTP
`;

server = server.replace('// Diagnostic endpoint for SMTP', endpointCode);

fs.writeFileSync('server.ts', server);
