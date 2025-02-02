import React, { useState } from 'react';
import { Album } from '../types';
import { CreateAlbumModal } from './CreateAlbumModal';
import './AlbumList.css';

interface Props {
  albums: Album[];
  onAlbumClick: (album: Album) => void;
  onCreateAlbum: () => void;
  onShowSettings: () => void;
  onEditAlbum: (albumId: string, data: { 
    title: string;
    date: string;
    description: string;
    isPublic: boolean;
    hasPassword: boolean;
    password?: string;
  }) => void;
}

const getMediaUrl = (path: string) => {
  return `http://localhost:5001/uploads/${path}`;
};

export function AlbumList({ albums, onAlbumClick, onCreateAlbum, onShowSettings, onEditAlbum }: Props) {
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

  const getAlbumCover = (album: Album) => {
    // 尋找被標記為封面的檔案
    const coverFile = album.files.find(file => file.isCover);
    if (coverFile) {
      return getMediaUrl(coverFile.path);
    }
    // 如果沒有封面，使用第一個檔案
    if (album.files.length > 0) {
      return getMediaUrl(album.files[0].path);
    }
    return null;
  };

  const handleEditClick = (e: React.MouseEvent, album: Album) => {
    e.stopPropagation();
    setEditingAlbum(album);
  };

  const handleEditSubmit = (data: {
    title: string;
    date: string;
    description: string;
    isPublic: boolean;
    hasPassword: boolean;
    password?: string;
  }) => {
    if (editingAlbum) {
      onEditAlbum(editingAlbum.id.toString(), data);
      setEditingAlbum(null);
    }
  };

  return (
    <div className="album-list">
      <nav className="top-nav">
        <div className="nav-tabs">
          <button className="nav-tab active">相簿</button>
          <button className="nav-tab disabled">照片</button>
          <button className="nav-tab disabled">視頻</button>
        </div>
      </nav>

      <div className="function-bar">
        <div className="left-actions">
          <button className="action-btn upload-btn">
            <span className="icon">📁</span> 上傳照片/視頻
          </button>
          <button className="action-btn" onClick={onCreateAlbum}>
            <span className="icon">➕</span> 創建相簿
          </button>
          <button className="action-btn" onClick={onShowSettings}>
            <span className="icon">⚙️</span> 展示設置
          </button>
        </div>
      </div>

      <div className="albums-grid">
        {albums.map((album) => (
          <div
            key={album.id}
            className="album-card"
            onClick={() => onAlbumClick(album)}
          >
            <div className="album-cover">
              {getAlbumCover(album) ? (
                <img
                  src={getAlbumCover(album)!}
                  alt={album.title}
                  loading="lazy"
                />
              ) : (
                <div className="album-placeholder">
                  <span className="icon">🖼️</span>
                </div>
              )}
              <div className="album-stats">
                {album.files.length}
              </div>
              {!album.isPublic && (
                <div className="privacy-badge">
                  <span className="icon">🔒</span>
                </div>
              )}
              <button 
                className="edit-btn"
                onClick={(e) => handleEditClick(e, album)}
              >
                <span className="icon">✏️</span>
              </button>
            </div>
            <div className="album-info">
              <h3 className="album-title">{album.title}</h3>
            </div>
          </div>
        ))}
      </div>

      {editingAlbum && (
        <CreateAlbumModal
          isOpen={true}
          onClose={() => setEditingAlbum(null)}
          onSubmit={handleEditSubmit}
          editingAlbum={editingAlbum}
        />
      )}
    </div>
  );
} 