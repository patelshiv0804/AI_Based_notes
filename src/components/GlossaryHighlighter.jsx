
// GlossaryHighlighter.jsx rewritten to match .tsx logic and structure
import React, { useEffect, useRef, useState } from 'react';
import AIService from '../services/AIService.js';
import '../styles/GlossaryHighlighter.css';

function GlossaryHighlighter({ children }) {
	const [popup, setPopup] = useState(null);
	const containerRef = useRef(null);

	useEffect(() => {
		const handleMouseOver = (e) => {
			const target = e.target;
			if (target.classList && target.classList.contains('glossary-term')) {
				const word = target.textContent || '';
				const definition = AIService.getDefinition(word);
				if (definition) {
					setPopup({
						term: { word, definition },
						x: e.clientX,
						y: e.clientY - 10
					});
				}
			}
		};

		const handleMouseOut = (e) => {
			const target = e.target;
			if (target.classList && target.classList.contains('glossary-term')) {
				setPopup(null);
			}
		};

		const container = containerRef.current;
		if (container) {
			container.addEventListener('mouseover', handleMouseOver);
			container.addEventListener('mouseout', handleMouseOut);

			// Highlight glossary terms
			const highlightTerms = () => {
				const textNodes = getTextNodes(container);
				const glossaryTerms = AIService.getGlossaryTerms();

				textNodes.forEach(node => {
					if (node.parentElement && node.parentElement.classList.contains('glossary-term')) return;

					let content = node.textContent || '';
					let hasMatch = false;

					glossaryTerms.forEach(term => {
						const regex = new RegExp(`\\b${term}\\b`, 'gi');
						if (regex.test(content)) {
							content = content.replace(regex, `<span class="glossary-term">${term}</span>`);
							hasMatch = true;
						}
					});

					if (hasMatch && node.parentElement) {
						const wrapper = document.createElement('div');
						wrapper.innerHTML = content;
						while (wrapper.firstChild) {
							node.parentElement.insertBefore(wrapper.firstChild, node);
						}
						node.remove();
					}
				});
			};

			const timeoutId = setTimeout(highlightTerms, 500);
			return () => clearTimeout(timeoutId);
		}

		return () => {
			if (container) {
				container.removeEventListener('mouseover', handleMouseOver);
				container.removeEventListener('mouseout', handleMouseOut);
			}
		};
	}, []);

	const getTextNodes = (element) => {
		const textNodes = [];
		const walker = document.createTreeWalker(
			element,
			NodeFilter.SHOW_TEXT,
			null
		);
		let node;
		while ((node = walker.nextNode())) {
			textNodes.push(node);
		}
		return textNodes;
	};

	return (
		<div ref={containerRef} className="glossary-container">
			{children}
			{popup && (
				<div
					className="glossary-popup"
					style={{
						left: popup.x,
						top: popup.y,
						position: 'fixed',
						zIndex: 1000
					}}
				>
					<div className="popup-header">
						<strong>{popup.term.word}</strong>
					</div>
					<div className="popup-content">
						{popup.term.definition}
					</div>
				</div>
			)}
		</div>
	);
}

export default GlossaryHighlighter;