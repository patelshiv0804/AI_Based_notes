import { Pin, Trash2, Calendar, Lock } from 'lucide-react';
import '../styles/NotesList.css';

function NotesList({ notes, activeNote, onSelectNote, onDeleteNote, onTogglePin }) {
	const formatDate = (date) => {
		const now = new Date();
		const noteDate = new Date(date);
		const diffInDays = Math.floor((now.getTime() - noteDate.getTime()) / (1000 * 60 * 60 * 24));
		if (diffInDays === 0) return 'Today';
		if (diffInDays === 1) return 'Yesterday';
		if (diffInDays < 7) return `${diffInDays} days ago`;
		return noteDate.toLocaleDateString();
	};

	const getPreview = (content, maxLength = 100) => {
		const textContent = content.replace(/<[^>]*>/g, '').trim();
		if (textContent.length <= maxLength) return textContent;
		return textContent.substring(0, maxLength) + '...';
	};

	if (notes.length === 0) {
		return (
			<div className="notes-list empty">
				<div className="empty-state">
					<div className="empty-icon">
						<Calendar size={48} />
					</div>
					<h3>No notes yet</h3>
					<p>Create your first note to get started</p>
				</div>
			</div>
		);
	}

	return (
		<div className="notes-list">
			<div className="notes-header">
				<h2>All Notes ({notes.length})</h2>
			</div>
			<div className="notes-container">
				{notes.map(note => (
					<div
						key={note.id}
						className={`note-item ${activeNote?.id === note.id ? 'active' : ''} ${note.isPinned ? 'pinned' : ''}`}
						onClick={() => onSelectNote(note)}
					>
						<div className="note-header">
							<div className="note-indicators">
								{note.isPinned && (
									<Pin size={14} className="pin-indicator" />
								)}
								{note.isEncrypted && (
									<Lock size={14} className="lock-indicator" />
								)}
							</div>
							<div className="note-actions">
								<button
									onClick={e => {
										e.stopPropagation();
										onTogglePin(note.id);
									}}
									className={`action-btn ${note.isPinned ? 'pinned' : ''}`}
									title={note.isPinned ? 'Unpin note' : 'Pin note'}
								>
									<Pin size={16} />
								</button>
								<button
									onClick={e => {
										e.stopPropagation();
										onDeleteNote(note.id);
									}}
									className="action-btn delete"
									title="Delete note"
								>
									<Trash2 size={16} />
								</button>
							</div>
						</div>
						<div className="note-content">
							<h3 className="note-title">{note.title}</h3>
							<p className="note-preview">{getPreview(note.content) || 'No content...'}</p>
							{note.tags && note.tags.length > 0 && (
								<div className="note-tags">
									{note.tags.slice(0, 3).map(tag => (
										<span key={tag} className="tag">
											{tag}
										</span>
									))}
								</div>
							)}
							<div className="note-footer">
								<span className="note-date">
									{formatDate(note.updatedAt)}
								</span>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export default NotesList;