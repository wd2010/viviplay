
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Correct initialization of GoogleGenAI using a named parameter and direct environment variable access
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFantasyAdvice = async (points: number, userName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一位奇幻乐园的先知。一位名叫 ${userName} 的旅行者现在拥有 ${points} 积分。请给他们一段简短、鼓励且富有幽默感的奇幻风格建议，控制在两句话以内，使用中文回答。`,
      config: {
        temperature: 0.9,
        topP: 0.8,
      }
    });
    // Fix: Accessing the .text property directly as per the SDK guidelines
    return response.text || "星象今天有些沉默，继续你的冒险吧。";
  } catch (err) {
    return "星象今日有些模糊，旅行者，继续你的旅程吧！";
  }
};

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
