
import { GoogleGenAI } from "@google/genai";
import { Transaction, Category } from "../types";

export const getFinancialAdvice = async (transactions: Transaction[], categories: Category[], currencySymbol: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare a summary of data for the AI
  const summary = transactions.slice(0, 50).map(t => {
    const cat = categories.find(c => c.id === t.categoryId);
    return `${t.date}: ${t.type === 'income' ? '+' : '-'}${t.amount}${currencySymbol} (${cat?.name || 'Unknown'}) - ${t.note}`;
  }).join('\n');

  const prompt = `
    You are a professional financial advisor. Here is a list of recent transactions for a user:
    ${summary}

    Please analyze their spending habits and provide:
    1. A summary of where most of their money goes.
    2. Three actionable tips to save more money.
    3. An overall "Financial Health Score" from 1-10.
    
    Provide the response in Arabic, formatted nicely for a mobile app (use short paragraphs and bullet points).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "عذراً، حدث خطأ أثناء تحليل بياناتك المالية. يرجى المحاولة لاحقاً.";
  }
};
