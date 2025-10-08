import React, { useState, useEffect } from "react";
import {
  Brain,
  Sparkles,
  Tag,
  FileText,
  Languages,
  X,
  Loader,
} from "lucide-react";
import StorageService from "../services/StorageService.js";
import AIService from "../services/AIService.js";
import "../styles/AIPanel.css";

function AIPanel({ note, onUpdateNote }) {
  const [summary, setSummary] = useState("");
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [glossary, setGlossary] = useState([]);
  const [grammar, setGrammar] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("es");
  const [showAllGlossary, setShowAllGlossary] = useState(false);

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "zh", name: "Chinese" },
    { code: "ar", name: "Arabic" },
    { code: "ru", name: "Russian" },
    // { code: 'ja', name: 'Japanese' },
    { code: "ko", name: "Korean" },
    { code: "bn", name: "Bengali" },
    // { code: 'pa', name: 'Punjabi' },
    { code: "tr", name: "Turkish" },
  ];

  useEffect(() => {
    if (!note.isEncrypted) {
      generateAISuggestions();
    }
  }, [note.id, note.isEncrypted]);

  const generateAISuggestions = async () => {
    if (note.isEncrypted) return;
    setIsGenerating(true);
    const content = note.content.replace(/<[^>]*>/g, "");
    try {
      const groqResult = await AIService.analyzeNote(content);
      setSummary(groqResult.summary);
      setSuggestedTags(Array.isArray(groqResult.tags) ? groqResult.tags : []);
      setGlossary(
        Array.isArray(groqResult.glossary) ? groqResult.glossary : []
      );
      setGrammar(Array.isArray(groqResult.grammar) ? groqResult.grammar : []);
    } catch (e) {
      setSummary("Failed to fetch insights from Groq.");
      setSuggestedTags([]);
      setGlossary([]);
      setGrammar([]);
    }
    setIsGenerating(false);
  };

  const applySuggestedTags = async () => {
    // Make a copy of the current note and update its tags
    if (note.isEncrypted) return;
    // Send only the changed fields; parent will merge and set updatedAt
    onUpdateNote({
      id: note.id,
      tags: [...(Array.isArray(suggestedTags) ? suggestedTags : [])],
    });
  };

  const translateNote = async () => {
    if (note.isEncrypted) return;
    if (!note.content) return;

    setIsGenerating(true);
    try {
      // Remove HTML tags before translation
      const plainContent = note.content.replace(/<[^>]*>/g, "");
      console.log("Translating content:", plainContent); // Debug
      const translatedContent = await AIService.translateNote(
        plainContent,
        selectedLanguage
      );
      console.log("Translated content:", translatedContent); // Debug

      if (translatedContent && translatedContent !== plainContent) {
        // Only send the changed content; parent will merge and set updatedAt
        onUpdateNote({ id: note.id, content: translatedContent });
      }
    } catch (e) {
      console.error("Translation failed:", e);
      // Do not overwrite note on error; no-op
    }
    setIsGenerating(false);
  };

  if (note.isEncrypted) {
    return (
      <div className="ai-panel" style={{ overflowY: "auto" }}>
        <div className="panel-header">
          <div className="panel-title">
            <Brain size={24} />
            <h3>AI Assistant</h3>
          </div>
        </div>
        <div className="panel-content">
          <div className="ai-section disabled-section">
            <div className="section-header">
              <FileText size={20} />
              <h4>Protected Note</h4>
            </div>
            <div className="disabled-content">
              <p>
                AI features are not available for protected notes. Unlock the
                note to access AI assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-panel" style={{ overflowY: "auto" }}>
      <div className="panel-header">
        <div className="panel-title">
          <Brain size={24} />
          <h3>AI Assistant</h3>
        </div>
      </div>

      <div className="panel-content">
        {isGenerating && (
          <div className="generating-overlay">
            <Loader className="spinning" size={32} />
            <p>AI is analyzing your note...</p>
          </div>
        )}

        <div className="ai-section">
          <div className="section-header">
            <Sparkles size={20} />
            <h4>Smart Summary</h4>
          </div>
          <div className="summary-content">
            {summary ? (
              <p>{summary}</p>
            ) : (
              <p className="placeholder">Generate a summary of your note...</p>
            )}
          </div>
          <button
            onClick={generateAISuggestions}
            className="ai-btn"
            disabled={isGenerating || note.isEncrypted}
          >
            Generate Summary
          </button>
        </div>

        <div className="ai-section">
          <div className="section-header">
            <Tag size={20} />
            <h4>Suggested Tags</h4>
          </div>
          <div className="tags-content">
            {Array.isArray(suggestedTags) && suggestedTags.length > 0 ? (
              <div className="suggested-tags">
                {suggestedTags.map((tag) => (
                  <span key={tag} className="suggested-tag">
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="placeholder">AI will suggest relevant tags...</p>
            )}
          </div>
          {Array.isArray(suggestedTags) && suggestedTags.length > 0 && (
            <button
              onClick={applySuggestedTags}
              className="ai-btn"
              disabled={
                isGenerating ||
                note.isEncrypted ||
                JSON.stringify(note.tags) === JSON.stringify(suggestedTags)
              }
            >
              {JSON.stringify(note.tags) === JSON.stringify(suggestedTags)
                ? "Tags Applied"
                : "Apply Tags"}
            </button>
          )}
        </div>

        <div className="ai-section">
          <div className="section-header">
            <FileText size={20} />
            <h4>Glossary Terms & Definitions</h4>
          </div>
          <div className="glossary-content">
            {Array.isArray(glossary) && glossary.length > 0 ? (
              <>
                <div className="glossary-items custom-scrollbar">
                  {glossary
                    .slice(0, showAllGlossary ? undefined : 2)
                    .map((item, index) => (
                      <div
                        key={`${item.term}-${index}`}
                        className="glossary-item"
                      >
                        <span className="glossary-term">{item.term}</span>
                        <span className="glossary-definition">
                          {item.definition}
                        </span>
                      </div>
                    ))}
                </div>
                {glossary.length > 2 && (
                  <button
                    onClick={() => setShowAllGlossary(!showAllGlossary)}
                    className="show-more-btn"
                  >
                    {showAllGlossary
                      ? "Show Less"
                      : `Show ${glossary.length - 2} More Terms`}
                  </button>
                )}
                <div className="glossary-count">
                  Found {glossary.length} term{glossary.length !== 1 ? "s" : ""}
                </div>
              </>
            ) : (
              <p className="placeholder">
                AI will identify and define important terms from your note...
              </p>
            )}
          </div>
        </div>

        <div className="ai-section" style={{ overflowX: "hidden" }}>
          <div className="section-header">
            <FileText size={20} />
            <h4>Grammar Check</h4>
          </div>
          <div className="grammar-content">
            {Array.isArray(grammar) ? (
              grammar.length > 0 ? (
                <div className="grammar-issues">
                  <div className="grammar-status error">
                    Found {grammar.length} grammar issue
                    {grammar.length !== 1 ? "s" : ""}:
                  </div>
                  <ul className="grammar-list">
                    {grammar.map((issue, idx) => (
                      <li key={idx} className="grammar-item">
                        <div className="grammar-error">
                          <strong>Original:</strong> "{issue.text}"
                        </div>
                        <div className="grammar-suggestion">
                          <strong>Suggestion:</strong> "{issue.suggestion}"
                        </div>
                        {issue.explanation && (
                          <div className="grammar-explanation">
                            {issue.explanation}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="grammar-status success">
                  No grammar issues found in your text. Well done! ✓
                </div>
              )
            ) : (
              <p className="placeholder">
                Click "Generate Summary" to check grammar...
              </p>
            )}
          </div>
        </div>

        <div className="ai-section">
          <div className="section-header">
            <Languages size={20} />
            <h4>Translation</h4>
          </div>
          <div className="translation-content">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="language-select"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={translateNote}
            className="ai-btn"
            disabled={isGenerating || note.isEncrypted}
          >
            Translate Note
          </button>
        </div>

        <div className="ai-section">
          <div className="section-header">
            <FileText size={20} />
            <h4>AI Insights</h4>
          </div>
          <div className="insights-content">
            <div className="insight-item">
              <span className="insight-label">Reading Time:</span>
              <span className="insight-value">
                {Math.ceil(note.content.replace(/<[^>]*>/g, "").length / 200)}{" "}
                min
              </span>
            </div>
            <div className="insight-item">
              <span className="insight-label">Word Count:</span>
              <span className="insight-value">
                {note.content.replace(/<[^>]*>/g, "").split(" ").length} words
              </span>
            </div>
            <div className="insight-item">
              <span className="insight-label">Characters:</span>
              <span className="insight-value">
                {note.content.replace(/<[^>]*>/g, "").length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIPanel;
