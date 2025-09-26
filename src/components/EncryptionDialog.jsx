import React, { useState } from 'react';
import { Shield, X, Lock, Unlock } from 'lucide-react';
import '../styles/EncryptionDialog.css';

function EncryptionDialog({ note, onUpdateNote, onClose }) {
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [currentPassword, setCurrentPassword] = useState('');

	const handleEncrypt = () => {
		if (password !== confirmPassword) {
			alert('Passwords do not match!');
			return;
		}
		if (password.length < 6) {
			alert('Password must be at least 6 characters long!');
			return;
		}
		// Only set isEncrypted and password, never touch content
		const encryptedNote = {
			...note,
			isEncrypted: true,
			password: password,
			content: note.content // preserve content
		};
		onUpdateNote(encryptedNote);
		onClose();
	};

	const handleDecrypt = () => {
		if (currentPassword !== note.password) {
			alert('Incorrect password!');
			return;
		}
		// Only set isEncrypted and password, never touch content
		const decryptedNote = {
			...note,
			isEncrypted: false,
			password: undefined,
			content: note.content // preserve content
		};
		onUpdateNote(decryptedNote);
		onClose();
	};

	return (
		<div className="encryption-dialog-overlay">
			<div className="encryption-dialog">
				<div className="dialog-header">
					<div className="dialog-title">
						<Shield size={24} />
						<h3>{note.isEncrypted ? 'Remove Encryption' : 'Encrypt Note'}</h3>
					</div>
					<button onClick={onClose} className="close-btn">
						<X size={20} />
					</button>
				</div>
				<div className="dialog-content">
					{note.isEncrypted ? (
						<div className="decrypt-form">
							<div className="info-box">
								<Lock size={20} />
								<p>This note is currently encrypted. Enter the password to remove encryption.</p>
							</div>
							<div className="form-group">
								<label>Current Password:</label>
								<input
									type="password"
									value={currentPassword}
									onChange={e => setCurrentPassword(e.target.value)}
									placeholder="Enter current password..."
								/>
							</div>
							<div className="dialog-actions">
								<button onClick={onClose} className="cancel-btn">Cancel</button>
								<button 
									onClick={handleDecrypt}
									className="decrypt-btn"
									disabled={!currentPassword}
								>
									<Unlock size={16} />
									Remove Encryption
								</button>
							</div>
						</div>
					) : (
						<div className="encrypt-form">
							<div className="info-box">
								<Shield size={20} />
								<p>Encrypt this note with a password. You'll need to enter this password to view and edit the note.</p>
							</div>
							<div className="form-group">
								<label>Password:</label>
								<input
									type="password"
									value={password}
									onChange={e => setPassword(e.target.value)}
									placeholder="Enter password (min. 6 characters)..."
								/>
							</div>
							<div className="form-group">
								<label>Confirm Password:</label>
								<input
									type="password"
									value={confirmPassword}
									onChange={e => setConfirmPassword(e.target.value)}
									placeholder="Confirm password..."
								/>
							</div>
							<div className="password-strength">
								<div className="strength-bar">
									<div 
										className={`strength-fill ${
											password.length < 6 ? 'weak' : 
											password.length < 10 ? 'medium' : 'strong'
										}`}
										style={{ width: `${Math.min(100, (password.length / 12) * 100)}%` }}
									/>
								</div>
								<span className="strength-text">
									{password.length < 6 ? 'Weak' : 
										password.length < 10 ? 'Medium' : 'Strong'}
								</span>
							</div>
							<div className="dialog-actions">
								<button onClick={onClose} className="cancel-btn">Cancel</button>
								<button 
									onClick={handleEncrypt}
									className="encrypt-btn"
									disabled={!password || password !== confirmPassword}
								>
									<Lock size={16} />
									Encrypt Note
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default EncryptionDialog;