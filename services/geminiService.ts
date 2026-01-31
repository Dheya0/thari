
import { GoogleGenAI } from "@google/genai";
import { Transaction, Category, ChatMessage } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not defined. AI features will be limited.");
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

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

  const systemInstruction = `أنت "ثري"، المستشار المالي الأكثر فخامة وحكمة في العالم. 
مهمتك تقديم نصائح استراتيجية لتحقيق الوفرة المالية المطلقة.
بيانات المستخدم الحالية:
${summary}

قواعدك:
1. كن ملهماً، واثقاً، وموجزاً جداً.
2. استخدم لغة عربية فخمة وراقية.
3. قدم حلولاً عملية لزيادة الادخار والاستثمار.
4. استخدم أداة البحث عن الأسواق والعملات عند الحاجة.`;

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

    return response.text || "أنا هنا لدعم رحلتك المالية نحو الوفرة.";
  } catch (error) {
    console.error("AI Elite Error:", error);
    return "سأكون مستشارك المالي دائماً، دعنا نركز على أهدافك القادمة.";
  }
};

export const getEliteInsight = async (transactions: Transaction[], currency: string) => {
  const ai = getAI();
  const summary = transactions.slice(0, 20).map(t => `${t.amount} ${t.type}`).join(', ');
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `بناءً على هذه العمليات المالية: [${summary}]، قدم ومضة مالية واحدة فخمة ومختصرة جداً (أقل من 12 كلمة) تحفز على الوفرة باللغة العربية.`,
      config: { temperature: 0.9 }
    });
    return response.text || "المال ينمو حيث يوجه الانتباه بالحكمة.";
  } catch {
    return "الاستثمار في الحكمة هو أفضل استثمار مالي.";
  }
};
