import React, { useState, useEffect } from "react";
import { Search, Plus, Settings, Brain, Shield, Pin } from "lucide-react";
import RichTextEditor from "./components/RichTextEditor.jsx";
import NotesList from "./components/NotesList.jsx";
import AIPanel from "./components/AIPanel.jsx";
import EncryptionDialog from "./components/EncryptionDialog.jsx";
import StorageService from "./services/StorageService.js";
import AIService from "./services/AIService.js";
import "./styles/App.css";

function App() {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showEncryption, setShowEncryption] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load notes from storage
    const savedNotes = StorageService.getNotes();
    setNotes(savedNotes);
    setIsLoading(false);
  }, []);

  const createNewNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: false,
      isEncrypted: false,
      tags: [],
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setActiveNote(newNote);
    StorageService.saveNotes(updatedNotes);
  };

  const updateNote = (updatedNote) => {
    const updatedNotes = notes.map((note) =>
      note.id === updatedNote.id
        ? { ...updatedNote, updatedAt: new Date() }
        : note
    );
    setNotes(updatedNotes);
    setActiveNote(updatedNote);
    StorageService.saveNotes(updatedNotes);
  };

  const deleteNote = (noteId) => {
    const updatedNotes = notes.filter((note) => note.id !== noteId);
    setNotes(updatedNotes);
    if (activeNote?.id === noteId) {
      setActiveNote(null);
    }
    StorageService.saveNotes(updatedNotes);
  };

  const togglePin = (noteId) => {
    const updatedNotes = notes.map((note) =>
      note.id === noteId ? { ...note, isPinned: !note.isPinned } : note
    );
    setNotes(updatedNotes);
    StorageService.saveNotes(updatedNotes);
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading your notes...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="main-content">
        <header
          className="app-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 30px",
            background: "white",
            borderBottom: "1px solid rgba(0,0,0,0.1)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            className="header-left"
            style={{ display: "flex", alignItems: "center", gap: 30 }}
          >
            <div
              className="logo"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: "#667eea",
              }}
            >
              <Brain size={32} />
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  margin: 0,
                }}
              >
                AI Notes
              </h1>
            </div>
            <div
              className="search-container"
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Search
                className="search-icon"
                size={20}
                style={{
                  position: "absolute",
                  left: 12,
                  color: "#9ca3af",
                  zIndex: 1,
                }}
              />
              <input
                type="text"
                className="search-input"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "12px 40px",
                  border: "2px solid #e5e7eb",
                  borderRadius: 12,
                  fontSize: 14,
                  width: 300,
                  transition: "all 0.2s",
                  background: "rgba(255,255,255,0.9)",
                }}
              />
            </div>
          </div>
          <div
            className="header-right"
            style={{ display: "flex", alignItems: "center", gap: 24 }}
          >
            {/* <button
							style={{display: 'flex', alignItems: 'center', gap: 10, background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(102,126,234,0.10)', border: 'none', padding: '16px 28px', fontWeight: 600, fontSize: 16, color: '#374151', cursor: 'pointer'}}
							onClick={() => setShowAIPanel(true)}
						>
							<Brain size={24} style={{color: '#667eea'}} />
							AI Features
						</button> */}
            <button
              className="new-note-btn"
              onClick={createNewNote}
              title="New Note"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                borderRadius: 16,
                border: "none",
                fontWeight: 600,
                fontSize: 18,
                padding: "16px 32px",
                boxShadow: "0 4px 24px rgba(102,126,234,0.10)",
                cursor: "pointer",
              }}
            >
              <Plus size={24} />
              New Note
            </button>
          </div>
        </header>
        {/* <div className="content-area" style={{height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'row', width: '100%'}}>
							<div className="notes-section" style={{background: 'transparent', borderRight: 'none', minWidth: 320}}>
								<NotesList
									notes={sortedNotes}
									activeNote={activeNote}
									onSelectNote={setActiveNote}
									onDeleteNote={deleteNote}
									onTogglePin={togglePin}
								/>
							</div>
							<div className="editor-section" style={{background: 'transparent', borderLeft: 'none', flex: 1}}>
								{activeNote ? (
									<RichTextEditor
										note={activeNote}
										onUpdateNote={updateNote}
										onToggleEncryption={() => setShowEncryption(true)}
									/>
								) : (
									<div className="empty-editor">
										<div className="empty-content">
											<button className="create-note-btn" onClick={createNewNote}>
												<Plus size={48} />
											</button>
											<h3>Start Writing</h3>
											<p>Create a new note or select an existing one to begin editing</p>
										</div>
									</div>
								)}
							</div>
							
							<div style={{minWidth: 350, maxWidth: 400, height: '100%'}}>
								{activeNote && (
									<AIPanel
										note={activeNote}
										onUpdateNote={updateNote}
									/>
								)}
							</div>
						</div> */}

        <div className="content-area">
          <div className="notes-section">
            <NotesList
              notes={sortedNotes}
              activeNote={activeNote}
              onSelectNote={setActiveNote}
              onDeleteNote={deleteNote}
              onTogglePin={togglePin}
            />
          </div>

          <div className="top-editor-section">
            <div className="editor-section">
              {activeNote ? (
                <RichTextEditor
                  note={activeNote}
                  onUpdateNote={updateNote}
                  onToggleEncryption={() => setShowEncryption(true)}
                />
              ) : (
                <div className="empty-editor">
                  <div className="empty-content">
                    <button className="create-note-btn" onClick={createNewNote}>
                      <Plus size={48} />
                    </button>
                    <h3>Start Writing</h3>
                    <p>
                      Create a new note or select an existing one to begin
                      editing
                    </p>
                  </div>
                </div>
              )}
            </div>
            {activeNote && (
              <div className="ai-section">
                <AIPanel note={activeNote} onUpdateNote={updateNote} />
              </div>
            )}
          </div>
        </div>
        {showEncryption && activeNote && (
          <EncryptionDialog
            note={activeNote}
            onUpdateNote={updateNote}
            onClose={() => setShowEncryption(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
