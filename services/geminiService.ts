
import { GoogleGenAI } from "@google/genai";
import { Transaction, Category, ChatMessage } from "../types";

export const chatWithThari = async (
  userMessage: string, 
  history: ChatMessage[], 
  context: { transactions: Transaction[], categories: Category[], currency: string }
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const summary = context.transactions.slice(0, 50).map(t => {
    const cat = context.categories.find(c => c.id === t.categoryId);
    return `${t.date}: ${t.type === 'income' ? '+' : '-'}${t.amount}${context.currency} (${cat?.name || 'Unknown'}) - ${t.note}`;
  }).join('\n');

  const systemInstruction = `أنت "ثري"، المساعد المالي الذكي. بيانات المستخدم: ${summary}. قواعدك: 1. أجب بالعربية بود مهني. 2. نصائح مبنية على البيانات أعلاه. 3. كن مقتضباً ونافعاً.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history.map(msg => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        })),
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: { systemInstruction }
    });

    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "عذراً، عقلي مشتت حالياً.";
  }
};

export const analyzeReceipt = async (base64Image: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "حلل الفاتورة واستخرج JSON: {amount: number, date: string, category: string, note: string}. أجب بـ JSON فقط." }
        ]
      },
    });
    const cleanText = response.text?.replace(/```json|```/g, '').trim() || '{}';
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Receipt Analysis Error:", error);
    return null;
  }
};
