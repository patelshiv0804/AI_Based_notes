const StorageService = {
	STORAGE_KEY: 'ai_notes_data',
	saveNotes(notes) {
		try {
			const serializedNotes = notes.map(note => ({
				...note,
				createdAt: note.createdAt.toISOString(),
				updatedAt: note.updatedAt.toISOString()
			}));
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serializedNotes));
		} catch (error) {
			console.error('Failed to save notes:', error);
		}
	},
	getNotes() {
		try {
			const data = localStorage.getItem(this.STORAGE_KEY);
			if (!data) return [];
			const parsedNotes = JSON.parse(data);
			return parsedNotes.map(note => ({
				...note,
				createdAt: new Date(note.createdAt),
				updatedAt: new Date(note.updatedAt),
				tags: note.tags || []
			}));
		} catch (error) {
			console.error('Failed to load notes:', error);
			return [];
		}
	},
	clearAllData() {
		localStorage.removeItem(this.STORAGE_KEY);
	},
	exportNotes() {
		const notes = this.getNotes();
		return JSON.stringify(notes, null, 2);
	},
	importNotes(data) {
		try {
			const parsedNotes = JSON.parse(data);
			if (Array.isArray(parsedNotes)) {
				this.saveNotes(parsedNotes);
				return true;
			}
			return false;
		} catch (error) {
			console.error('Failed to import notes:', error);
			return false;
		}
	}
};

export default StorageService;