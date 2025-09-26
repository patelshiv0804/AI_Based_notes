import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type, Shield, Save, Eye, EyeOff } from 'lucide-react';
import StorageService from '../services/StorageService.js';
import AIService from '../services/AIService.js';
import GlossaryHighlighter from './GlossaryHighlighter.jsx';
import '../styles/RichTextEditor.css';

function RichTextEditor({ note, onUpdateNote, onToggleEncryption }) {
	const [title, setTitle] = useState(note.title);
	const [isPasswordVisible, setIsPasswordVisible] = useState(!note.isEncrypted);
	const [password, setPassword] = useState('');
	const [fontSize, setFontSize] = useState('16');
	const editorRef = useRef(null);
	const titleRef = useRef(null);

	// Remove hidden bidi control characters that can reverse typing order
	const sanitizeDirectionalMarks = (html) => {
		if (typeof html !== 'string') return html;
		// LRM/LRM, RLM, LRE/RLE/PDF, LRO/RLO, isolate marks, etc.
		const BIDI_REGEX = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
		return html.replace(BIDI_REGEX, '');
	};

	useEffect(() => {
		setTitle(note.title);
		setIsPasswordVisible(!note.isEncrypted);
		if (editorRef.current && !note.isEncrypted) {
			editorRef.current.innerHTML = sanitizeDirectionalMarks(note.content);
		}
	}, [note.id, note.isEncrypted]);

	// ...existing code...

	if (note.isEncrypted && !isPasswordVisible) {
		return (
			<div className="encrypted-editor" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
				<div style={{background: 'white', borderRadius: 20, boxShadow: '0 8px 32px rgba(102,126,234,0.10)', padding: 40, maxWidth: 400, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
					<Shield size={56} style={{color: '#667eea', marginBottom: 16}} />
					<h2 style={{fontSize: 28, fontWeight: 700, color: '#1f2937', marginBottom: 12}}>Protected Note</h2>
					<p style={{color: '#6b7280', marginBottom: 32, fontSize: 16}}>This note is password protected. Enter the password to view and edit.</p>
					<div style={{display: 'flex', gap: 12, marginBottom: 0}}>
						<input
							type="password"
							value={password}
							onChange={e => setPassword(e.target.value)}
							placeholder="Enter password..."
							style={{flex: 1, padding: '14px 18px', border: '2px solid #e5e7eb', borderRadius: 12, fontSize: 16}}
						/>
						<button
							style={{display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 12, border: 'none', fontWeight: 600, fontSize: 16, padding: '14px 28px', cursor: 'pointer'}}
							onClick={() => {
								if (password === note.password) {
									setIsPasswordVisible(true);
									// Restore note content in editor
									setTimeout(() => {
										if (editorRef.current) {
											editorRef.current.innerHTML = note.content;
										}
									}, 0);
								} else {
									alert('Incorrect password!');
								}
							}}
						>
							<Eye size={20} /> Unlock
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="rich-text-editor">
			<div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px'}}>
				<input
					ref={titleRef}
					className="note-title-input"
					value={title}
					onChange={e => {
						setTitle(e.target.value);
						onUpdateNote({ ...note, title: e.target.value });
					}}
					placeholder="Note title..."
					style={{margin: 0}}
				/>
				<button onClick={onToggleEncryption} style={{marginLeft: 16, padding: 12, borderRadius: 12, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none'}}>
					<Shield size={24} />
				</button>
			</div>
			<div className="editor-toolbar" style={{display: 'flex', alignItems: 'center', gap: 16, padding: '24px 32px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb'}}>
				<button onClick={() => document.execCommand('bold')}><Bold size={16} /></button>
				<button onClick={() => document.execCommand('italic')}><Italic size={16} /></button>
				<button onClick={() => document.execCommand('underline')}><Underline size={16} /></button>
				<span style={{height: 32, width: 1, background: '#e5e7eb', margin: '0 12px'}}></span>
				<button onClick={() => document.execCommand('justifyLeft')}><AlignLeft size={16} /></button>
				<button onClick={() => document.execCommand('justifyCenter')}><AlignCenter size={16} /></button>
				<button onClick={() => document.execCommand('justifyRight')}><AlignRight size={16} /></button>
				<span style={{height: 32, width: 1, background: '#e5e7eb', margin: '0 12px'}}></span>
				<span style={{display: 'flex', alignItems: 'center', gap: 8}}>
					<Type size={16} />
					<select value={fontSize} onChange={e => setFontSize(e.target.value)} style={{padding: '6px 12px', borderRadius: 6, border: '1px solid #e5e7eb'}}>
						<option value="8">8px</option>
						<option value="10">10px</option>
						<option value="12">12px</option>
						<option value="14">14px</option>
						<option value="16">16px</option>
						<option value="18">18px</option>
						<option value="20">20px</option>
					</select>
				</span>
				<span style={{height: 32, width: 1, background: '#e5e7eb', margin: '0 12px'}}></span>
				<button style={{background: '#10b981', color: 'white', borderRadius: 6, padding: '8px 24px', border: 'none', fontWeight: 500}}>Grammar Check</button>
			</div>
			<GlossaryHighlighter>
				<div
					ref={editorRef}
					className="note-editor"
					dir="ltr"
					contentEditable={(!note.isEncrypted || isPasswordVisible)}
					style={{ fontSize: `${fontSize}px`, padding: '32px', direction: 'ltr', unicodeBidi: 'plaintext', textAlign: 'left', maxWidth: '52vw' }}
					onInput={() => {
						if (!editorRef.current) return;
						const sanitized = sanitizeDirectionalMarks(editorRef.current.innerHTML);
						if (sanitized !== editorRef.current.innerHTML) {
							editorRef.current.innerHTML = sanitized;
							// Move caret to end after sanitizing
							const range = document.createRange();
							range.selectNodeContents(editorRef.current);
							range.collapse(false);
							const sel = window.getSelection();
							if (sel) {
								sel.removeAllRanges();
								sel.addRange(range);
							}
						}
						onUpdateNote({ ...note, content: sanitized });
					}}
					suppressContentEditableWarning={true}
				></div>
			</GlossaryHighlighter>
		</div>
	);
}

export default RichTextEditor;