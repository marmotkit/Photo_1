import React, { useState, useCallback } from 'react';
import { Album } from '../types';
import './Modal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  albums: Album[];
  onUpload: (albumId: number, files: FileList, password?: string) => Promise<void>;
}

export function UploadModal({ isOpen, onClose, albums, onUpload }: Props) {
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | ''>('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const selectedAlbum = selectedAlbumId ? albums.find(a => a.id === selectedAlbumId) : null;

  const handleUpload = async (files: FileList) => {
    if (!selectedAlbumId) {
      setError('請選擇相簿');
      return;
    }

    if (selectedAlbum?.hasPassword && !password) {
      setError('請輸入相簿密碼');
      return;
    }

    try {
      setError('');
      setIsUploading(true);
      await onUpload(selectedAlbumId, files, selectedAlbum?.hasPassword ? password : undefined);
      setPassword('');
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : '上傳失敗，請稍後重試');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    handleUpload(files);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files);
    }
  }, [selectedAlbumId, password, selectedAlbum]);

  const handleAlbumChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedAlbumId(value ? parseInt(value) : '');
    setPassword('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>上傳照片/視頻</h2>
          <button className="close-icon" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="album">選擇相簿</label>
            <select
              id="album"
              value={selectedAlbumId}
              onChange={handleAlbumChange}
              required
            >
              <option value="">請選擇相簿</option>
              {albums.map(album => (
                <option key={album.id} value={album.id}>
                  {album.title} {!album.isPublic && '🔒'}
                </option>
              ))}
            </select>
          </div>

          {selectedAlbum?.hasPassword && (
            <div className="form-group">
              <label htmlFor="password">相簿密碼</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入相簿密碼"
                required
              />
            </div>
          )}

          {selectedAlbumId && (
            <div className="form-group">
              <label className={`upload-label ${isUploading || (selectedAlbum?.hasPassword && !password) ? 'disabled' : ''}`}>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  disabled={isUploading || (selectedAlbum?.hasPassword && !password)}
                />
                <div 
                  className={`upload-area ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <span className="icon">{isUploading ? '⏳' : '📁'}</span>
                  <p>{isUploading ? '正在上傳...' : '點擊或拖放文件到此處上傳'}</p>
                  <p className="help-text">支持圖片和視頻文件</p>
                </div>
              </label>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    </div>
  );
} 