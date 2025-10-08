
import { analyzeNote as groqAnalyzeNote, translateNote as groqTranslateNote } from '../utils/aiModel.js';

const AIService = {
	async analyzeNote(content) {
		if (!content) {
			return {
				glossary: [],
				summary: "",
				tags: [],
				grammar: []
			};
		}
		try {
			const groqResult = await groqAnalyzeNote(content);
			if (!groqResult) {
				throw new Error("No response from AI model");
			}
			return {
				glossary: (groqResult.glossary || []),
				summary: groqResult.summary || "",
				tags: groqResult.tags || [],
				grammar: (groqResult.grammarIssues || []).map(issue => ({
					text: issue.text,
					suggestion: issue.suggestion,
					index: 0,
					length: issue.text?.length || 0
				}))
			};
		} catch (error) {
			console.error("AI analysis failed:", error);
			
			const plain = content.replace(/<[^>]+>/g, " ");
			const firstSentence = plain.split(/[.!?](\s|$)/)[0];
			return {
				glossary: [],
				summary: firstSentence || "Failed to analyze note. Please try again.",
				tags: [],
				grammar: []
			};
		}
	},
	async translateNote(content, targetLanguage) {
		return await groqTranslateNote(content, targetLanguage);
	}
};

export default AIService;