import Groq from 'groq-sdk';

export const config = { runtime: 'nodejs' };

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured on server' });
  }

  try {
    const groq = new Groq({ apiKey });
    const { messages, tools, tool_choice } = req.body;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      tools,
      tool_choice,
    });

    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
