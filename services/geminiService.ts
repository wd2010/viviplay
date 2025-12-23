
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Correct initialization of GoogleGenAI using a named parameter and direct environment variable access
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const suggestFantasyItem = async (type: 'action' | 'product') => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `生成一个新的奇幻风格${type === 'action' ? '积分项' : '商品'}。使用中文返回 JSON 格式。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            value: { type: Type.NUMBER, description: '分值或售价' },
            emoji: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["name", "value", "emoji"]
        }
      }
    });
    // Fix: Using the .text property directly and handling potential undefined value
    const jsonStr = response.text;
    return jsonStr ? JSON.parse(jsonStr) : null;
  } catch (err) {
    return null;
  }
};
