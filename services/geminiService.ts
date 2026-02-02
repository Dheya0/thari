
import { GoogleGenAI } from "@google/genai";
import { Transaction, Category, ChatMessage, Goal } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("Thari AI Error: API_KEY is missing.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const chatWithThari = async (
  userMessage: string, 
  history: ChatMessage[], 
  context: { transactions: Transaction[], categories: Category[], currency: string }
) => {
  const ai = getAI();
  if (!ai) return "عذراً، خدمة الذكاء الاصطناعي غير مفعلة.";

  const summary = context.transactions.slice(0, 30).map(t => {
    const cat = context.categories.find(c => c.id === t.categoryId);
    return `${t.date}: ${t.type === 'income' ? '+' : '-'}${t.amount}${context.currency} (${cat?.name || 'Unknown'})`;
  }).join('\n');

  const systemInstruction = `أنت "ثري"، المستشار المالي الأكثر فخامة وحكمة. 
مهمتك تقديم نصائح استراتيجية لتحقيق الوفرة.
بيانات المستخدم الحالية:
${summary}
قواعدك: كن ملهماً، فخماً، وموجزاً. استخدم لغة عربية راقية.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...history.slice(-10).map(msg => ({
          role: msg.role === 'model' ? 'model' : 'user' as const,
          parts: [{ text: msg.text }]
        })),
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: { systemInstruction, tools: [{ googleSearch: {} }] }
    });
    return response.text || "أنا هنا لدعم رحلتك المالية.";
  } catch (error) {
    return "واجهت صعوبة في الاتصال بخوادم الحكمة المالية.";
  }
};

/**
 * محاكاة المستقبل المالي بناءً على البيانات الحالية
 */
export const getFinancialForecast = async (transactions: Transaction[], currency: string) => {
  const ai = getAI();
  if (!ai) return null;

  const summary = transactions.slice(0, 50).map(t => `${t.type}: ${t.amount}`).join(', ');
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `بناءً على تاريخ العمليات المالي التالي: [${summary}]، قم بإنتاج توقع مالي لـ 6 أشهر القادمة.
أجب بتنسيق JSON حصراً:
{
  "projectedBalance": number,
  "insight": "نصيحة فخمة جداً ومختصرة"،
  "savingPotential": "مبلغ يمكن توفيره شهرياً"
}`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch {
    return null;
  }
};

/**
 * تحسين الوصول للأهداف المالية
 */
export const getGoalAdvice = async (goal: Goal, transactions: Transaction[], currency: string) => {
  const ai = getAI();
  if (!ai) return null;

  const monthlySavings = transactions
    .filter(t => {
      const date = new Date(t.date);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return date > oneMonthAgo;
    })
    .reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `الهدف: ${goal.name}, المبلغ المطلوب: ${goal.targetAmount}, المبلغ الحالي: ${goal.currentAmount}, متوسط الادخار الشهري الحالي: ${monthlySavings} ${currency}.
قدم نصيحة واحدة فخمة جداً (أقل من 15 كلمة) حول كيفية الوصول للهدف أسرع.`,
    });
    return response.text;
  } catch {
    return "الاستمرار في العادات المالية الصحيحة هو مفتاح الثروة.";
  }
};
