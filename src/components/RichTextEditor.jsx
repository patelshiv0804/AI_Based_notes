import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, Shield, Save, Eye, EyeOff, List, ListOrdered } from 'lucide-react';
import StorageService from '../services/StorageService.js';
import AIService from '../services/AIService.js';
import GlossaryHighlighter from './GlossaryHighlighter.jsx';
import '../styles/RichTextEditor.css';

function RichTextEditor({ note, onUpdateNote, onToggleEncryption }) {
	const [title, setTitle] = useState(note.title);
	const [isPasswordVisible, setIsPasswordVisible] = useState(!note.isEncrypted);
	const [password, setPassword] = useState('');
	const [fontSize, setFontSize] = useState('16');
	const [wordCount, setWordCount] = useState(0);
	const [charCount, setCharCount] = useState(0);
	const [readingTime, setReadingTime] = useState(0);
	const editorRef = useRef(null);
	const titleRef = useRef(null);
	const isUserTypingRef = useRef(false);
	// Timeout for debouncing user typing
	const typingTimeoutRef = useRef(null);

	// Remove hidden bidi control characters that can reverse typing order
	const sanitizeDirectionalMarks = (html) => {
		if (typeof html !== 'string') return html;
		// LRM/LRM, RLM, LRE/RLE/PDF, LRO/RLO, isolate marks, etc.
		const BIDI_REGEX = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
		return html.replace(BIDI_REGEX, '');
	};

	// Normalize non-breaking spaces (HTML entity and unicode) to regular spaces
	const normalizeNbsp = (html) => {
		if (typeof html !== 'string') return html;
		return html.replace(/&nbsp;|\u00A0/g, ' ');
	};

	useEffect(() => {
		setTitle(note.title);
		setIsPasswordVisible(!note.isEncrypted);
		if (editorRef.current) {
			// always ensure explicit LTR attributes on the DOM node
			editorRef.current.setAttribute('dir', 'ltr');
			editorRef.current.style.unicodeBidi = 'isolate';
			editorRef.current.style.direction = 'ltr';
		}
		// Only update the editor content from external changes when the user is not typing
		if (
			editorRef.current &&
			!note.isEncrypted &&
			!isUserTypingRef.current &&
			document.activeElement !== editorRef.current
		) {
			// sanitize directional marks and normalize NBSPs before loading into editor
			editorRef.current.innerHTML = normalizeNbsp(sanitizeDirectionalMarks(note.content));
		}
	}, [note.id, note.isEncrypted, note.content]);

	const calculateMetrics = (content) => {
		const plainText = content.replace(/<[^>]*>/g, '').trim();
		const words = plainText.split(/\s+/).filter(word => word.length > 0);
		setWordCount(words.length);
		setCharCount(plainText.length);
		setReadingTime(Math.ceil(words.length / 200)); // Assuming 200 words per minute
	};

	useEffect(() => {
		if (editorRef.current) {
			calculateMetrics(editorRef.current.innerHTML);
		}
	}, [note.content]);

	// Update metrics dynamically as user types
	const handleInput = () => {
		// mark that user is typing to avoid external updates overwriting the DOM
		isUserTypingRef.current = true;
		if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
		typingTimeoutRef.current = setTimeout(() => {
			isUserTypingRef.current = false;
		}, 300);
		if (!editorRef.current) return;
		// Don't rewrite the editor DOM here (it can break caret/IME, and caused spaces to disappear).
		// Instead, compute a sanitized version for persisting and metrics, but let the browser
		// keep the DOM as-is while the user types.
		const currentHTML = editorRef.current.innerHTML;
		const sanitizedForSave = normalizeNbsp(sanitizeDirectionalMarks(currentHTML));
		onUpdateNote({ ...note, content: sanitizedForSave });
		calculateMetrics(sanitizedForSave);
	};

	// Apply font size to selection or to whole editor when no selection
	const applyFontSize = (size) => {
		const num = parseInt(size, 10);
		if (!editorRef.current) return;
		const sel = window.getSelection();
		if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
			// No selection: change whole editor font size
			setFontSize(size);
			// update editor display (style is bound to state)
			return;
		}

		// There is a selection: wrap selected content in a span with font-size
		try {
			const range = sel.getRangeAt(0);
			const span = document.createElement('span');
			span.style.fontSize = `${num}px`;
			// Preserve existing inline formatting by moving the extracted nodes inside span
			const extracted = range.extractContents();
			span.appendChild(extracted);
			range.insertNode(span);

			// Move caret after the inserted span
			sel.removeAllRanges();
			const newRange = document.createRange();
			newRange.setStartAfter(span);
			newRange.collapse(true);
			sel.addRange(newRange);

			// Persist changes to note and recalc metrics
			const sanitized = normalizeNbsp(sanitizeDirectionalMarks(editorRef.current.innerHTML));
			onUpdateNote({ ...note, content: sanitized });
			calculateMetrics(sanitized);
		} catch (err) {
			console.error('Failed to apply font size to selection', err);
		}
	};

	if (note.isEncrypted && !isPasswordVisible) {
		return (
			<div className="encrypted-editor">
				<div className="encryption-overlay">
					<Shield size={56} className="encryption-icon" />
					<h3>Protected Note</h3>
					<p>This note is password protected. Enter the password to view and edit.</p>
					<div className="password-input-group">
						<input
							type="password"
							value={password}
							onChange={e => setPassword(e.target.value)}
							placeholder="Enter password..."
							className="password-input unlock-password-input"
						/>
						<button
							className="unlock-btn"
							onClick={() => {
								if (password === note.password) {
									setIsPasswordVisible(true);
									onUpdateNote({ ...note, isEncrypted: false }); // Update note state to unlocked

									// Restore note content in editor
									setTimeout(() => {
										if (editorRef.current) {
											editorRef.current.innerHTML = normalizeNbsp(sanitizeDirectionalMarks(note.content));
										}
									}, 0);

									// Trigger AI analysis for unlocked note
									AIService.analyzeNote(note.content).then((analysis) => {
										console.log('AI Analysis:', analysis);
									}).catch((error) => {
										console.error('AI Analysis failed:', error);
									});
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
			<div className="editor-top-header">
				<input
					ref={titleRef}
					className="note-title-input"
					value={title}
					onChange={e => {
						setTitle(e.target.value);
						onUpdateNote({ ...note, title: e.target.value });
					}}
					placeholder="Note title..."
				/>
				{/* Small edit icon to indicate title is editable */}
				<button
					className="note-title-edit-btn"
					aria-label="Edit title"
					type="button"
					onClick={() => {
						if (titleRef.current) {
							titleRef.current.focus();
							const val = titleRef.current.value;
							titleRef.current.setSelectionRange(val.length, val.length);
						}
					}}
				>
					{/* inline pencil SVG */}
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
						<path d="M3 21v-3.75L17.81 2.44a1.5 1.5 0 0 1 2.12 0l.63.63a1.5 1.5 0 0 1 0 2.12L5.75 20.0H3z" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
						<path d="M14.06 3.94l5.0 5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</button>
				<button className="encrypt-btn encrypt-toggle">
					<Shield size={24} />
				</button>
			</div>
			<div className="editor-toolbar editor-toolbar--large">
				<button onClick={() => document.execCommand('bold')}><Bold size={16} /></button>
				<button onClick={() => document.execCommand('italic')}><Italic size={16} /></button>
				<button onClick={() => document.execCommand('underline')}><Underline size={16} /></button>
				<span className="toolbar-separator" />
				<button onClick={() => document.execCommand('justifyLeft')}><AlignLeft size={16} /></button>
				<button onClick={() => document.execCommand('justifyCenter')}><AlignCenter size={16} /></button>
				<button onClick={() => document.execCommand('justifyRight')}><AlignRight size={16} /></button>
				<button onClick={() => document.execCommand('justifyFull')}><AlignJustify size={16} /></button>
				<span className="toolbar-separator" />
				<span className="font-size-control">
					<Type size={16} />
					<select value={fontSize} onChange={e => applyFontSize(e.target.value)} className="font-size-select">
						<option value="8">8px</option>
						<option value="10">10px</option>
						<option value="12">12px</option>
						<option value="14">14px</option>
						<option value="16">16px</option>
						<option value="18">18px</option>
						<option value="20">20px</option>
					</select>
				</span>
				<span className="toolbar-separator" />
				<button onClick={() => document.execCommand('insertOrderedList')}><ListOrdered size={16} /></button>
				<button onClick={() => document.execCommand('insertUnorderedList')}><List size={16} /></button>
			</div>
			
			<GlossaryHighlighter>
				<div
					ref={editorRef}
					className={`note-editor fs-${fontSize}`}
					dir="ltr"
					contentEditable={(!note.isEncrypted || isPasswordVisible)}
					onInput={handleInput}
					suppressContentEditableWarning={true}
				></div>
			</GlossaryHighlighter>
			<div className="editor-metrics">
				<span>Words: {wordCount}</span>
				<span>Characters: {charCount}</span>
			</div>
		</div>
	);
}

export default RichTextEditor;