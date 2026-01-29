
import { GoogleGenAI } from "@google/genai";
import { Transaction, Category, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const chatWithThari = async (
  userMessage: string, 
  history: ChatMessage[], 
  context: { transactions: Transaction[], categories: Category[], currency: string }
) => {
  const summary = context.transactions.slice(0, 50).map(t => {
    const cat = context.categories.find(c => c.id === t.categoryId);
    return `${t.date}: ${t.type === 'income' ? '+' : '-'}${t.amount}${context.currency} (${cat?.name || 'Unknown'}) - ${t.note}`;
  }).join('\n');

  const systemPrompt = `أنت "ثري"، المساعد المالي الذكي والصديق الناصح. 
  بيانات المستخدم الحالية:
  ${summary}
  قواعدك:
  1. أجب باللغة العربية بلهجة ودودة ومهنية.
  2. قدم نصائح بناءً على البيانات الفعلية المذكورة أعلاه.
  3. كن مقتضباً ولكن مفيداً جداً.
  4. إذا سألك عن قدرته على الشراء، حلل رصيده ومصاريفه السابقة.`;

  try {
    const chat = ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...history.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }]
        })),
        { role: 'user', parts: [{ text: userMessage }] }
      ]
    });

    const response = await chat;
    return response.text;
  } catch (error) {
    console.error("Chat AI Error:", error);
    return "عذراً، عقلي مشتت قليلاً الآن. هل يمكننا الحديث لاحقاً؟";
  }
};

export const analyzeReceipt = async (base64Image: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "حلل الفاتورة واستخرج JSON: {amount: number, date: string, category: string, note: string}" }
        ]
      },
    });
    return JSON.parse(response.text.replace(/```json|```/g, '').trim());
  } catch (error) {
    return null;
  }
};
