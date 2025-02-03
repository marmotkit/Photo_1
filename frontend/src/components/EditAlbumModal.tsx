import React, { useState, useEffect } from 'react';
import { Album } from '../types';
import './Modal.css';

interface Props {
  album: Album;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (albumData: { title: string; description: string; isPublic: boolean }) => void;
}

export function EditAlbumModal({ album, isOpen, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState(album.title);
  const [description, setDescription] = useState(album.description || '');
  const [isPublic, setIsPublic] = useState(album.isPublic);

  useEffect(() => {
    if (isOpen) {
      setTitle(album.title);
      setDescription(album.description || '');
      setIsPublic(album.isPublic);
    }
  }, [isOpen, album]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, description, isPublic });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>編輯相簿</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">相簿名稱</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">描述</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              公開相簿
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              取消
            </button>
            <button type="submit" className="submit-btn">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 