
import { GoogleGenAI } from "@google/genai";
import { Transaction, Category, ChatMessage } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const chatWithThari = async (
  userMessage: string, 
  history: ChatMessage[], 
  context: { transactions: Transaction[], categories: Category[], currency: string }
) => {
  const ai = getAI();
  const summary = context.transactions.slice(0, 30).map(t => {
    const cat = context.categories.find(c => c.id === t.categoryId);
    return `${t.date}: ${t.type === 'income' ? '+' : '-'}${t.amount}${context.currency} (${cat?.name || 'Unknown'}) - ${t.note}`;
  }).join('\n');

  const systemInstruction = `أنت "ثري"، المستشار المالي الأكثر فخامة وحكمة. 
مهمتك تقديم نصائح استراتيجية للمال والوفرة.
بيانات المستخدم: ${summary}.
كن ملهماً، واثقاً، وموجزاً جداً. أجب بالعربية.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...history.slice(-10).map(msg => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        })),
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: { 
        systemInstruction,
        tools: [{ googleSearch: {} }] 
      }
    });

    return response.text;
  } catch (error) {
    return "سأكون مستشارك المالي دائماً.";
  }
};

export const getEliteInsight = async (transactions: Transaction[], currency: string) => {
  const ai = getAI();
  const summary = transactions.slice(0, 20).map(t => `${t.amount} ${t.type}`).join(', ');
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `بناءً على هذه العمليات: [${summary}]، قدم نصيحة مالية واحدة فخمة ومختصرة جداً (أقل من 15 كلمة) تحفز المستخدم على الوفرة باللغة العربية.`,
      config: { temperature: 0.8 }
    });
    return response.text;
  } catch {
    return "المال ينمو حيث يوجه الانتباه بالحكمة.";
  }
};
