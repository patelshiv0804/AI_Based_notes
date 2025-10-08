export async function translateNote(noteContent, targetLanguage) {
  try {
    const languageMap = {
      en: "English",
      hi: "Hindi",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
      zh: "Chinese (Simplified)",
      ar: "Arabic",
      ru: "Russian",
      ja: "Japanese",
      ko: "Korean",
      bn: "Bengali",
      pa: "Punjabi",
      tr: "Turkish",
    } ;

    const targetLangName = languageMap[targetLanguage] || targetLanguage;
    const systemPrompt = `You are an expert translator and localization specialist. Translate the following text into ${targetLangName} with fluent, natural, and idiomatic language while preserving the original meaning, tone, and formality.

    Rules:
      - Return ONLY the translated text. Do not add explanations, annotations, examples, or formatting notes.
      - Preserve technical terms, proper nouns, numbers, dates, code snippets, placeholders (e.g. {{name}}), markdown, and HTML tags exactly as they appear unless explicitly instructed to change them.
      - Keep paragraph and line-break boundaries as natural separators for translation; treat each block independently but preserve overall flow.
      - Prefer natural, idiomatic phrasing over literal word-for-word rendering.
      - Detect the source language automatically if not provided.
      - If a phrase is ambiguous, choose the most likely natural interpretation without inventing facts.
      - If you cannot translate a portion (e.g., an unknown token), copy it verbatim into the output.

      Now translate the user content exactly as instructed:`;
    const body = {
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: noteContent },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    };
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error("Groq API error: " + response.statusText);
    }
    const data = await response.json();
    const translated = data.choices?.[0]?.message?.content;
    if (!translated) throw new Error("No translation from AI");
    return translated;
  } catch (error) {
    console.error("Error translating note:", error);
    return noteContent;
  }
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export async function analyzeNote(noteContent) {
  try {
    const systemPrompt = `You are an advanced grammar checker and note analysis assistant. Analyze the text for grammar issues and important terms. Then provide the analysis in JSON format following this structure. 
    
    VERY IMPORTANT GUIDELINES:
    1. For grammar issues: ONLY include REAL errors - do not make up issues if the text is grammatically correct
    2. For glossary: ALWAYS identify important terms or phrases from the text that might need explanation
    3. Each glossary term MUST be a word or phrase that actually appears in the input text
    4. Provide clear, concise definitions for each term
    5. If there are no errors, return an empty array for grammarIssues

    {
      "summary": "A concise 2-3 sentence summary using only plain text. No formatting, no special characters.",
      "tags": ["simple tag1", "simple tag2", "simple tag3"],
      "glossary": [
        {
          "term": "exact word or phrase from the text",
          "definition": "clear, concise definition in plain text"
        }
      ],
      "grammarIssues": [
        {
          "text": "the exact text with the error",
          "type": "grammar/spelling/punctuation/style",
          "suggestion": "the corrected version",
          "explanation": "brief explanation of why this is an error"
        }
      ]
    }

    Guidelines:
    - Summary: Write 2-3 clear sentences in plain text only
    - Tags: Use 3-5 simple word tags without special characters
    - Glossary: Define terms using plain text only
    - Grammar: Provide corrections in plain text without formatting
    - NO markdown, NO formatting, NO special characters in any response
    - Keep all text simple and readable
    Make sure all responses are in plain text only.`;

    const body = {
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Please analyze this note and provide a complete analysis: ${noteContent}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    };

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Groq API error: " + response.statusText);
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI model");
    }
    const result = JSON.parse(content);
    return {
      summary: result.summary || "No summary available",
      tags: result.tags || [],
      insights: [],
      grammarIssues: (result.grammarIssues || []).map((issue) => ({
        text: issue.text,
        issue: issue.type,
        suggestion: issue.suggestion,
        explanation: issue.explanation,
      })),
      glossary: (result.glossary || []).map((item) => ({
        term: item.term,
        definition: item.definition,
      })),
    };
  } catch (error) {
    console.error("Error analyzing note:", error);
    return {
      summary: "Error analyzing note",
      tags: [],
      insights: [],
      grammarIssues: [],
      glossary: [],
    };
  }
}

export async function testAIConnection() {
  try {
    const body = {
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: "Respond with just: OK" }],
      max_tokens: 10,
    };
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.includes("OK") || false;
  } catch (error) {
    console.error("AI connection test failed:", error);
    return false;
  }
}
