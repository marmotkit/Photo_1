import React, { useState, useMemo } from 'react';
import { Album } from '../types';
import { CreateAlbumModal } from './CreateAlbumModal';
import { CategoryManageModal } from './CategoryManageModal';
import { DisplaySettingsModal, SortType } from './DisplaySettingsModal';
import { UploadModal } from './UploadModal';
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
  onUploadFiles: (albumId: number, files: FileList, password?: string) => Promise<void>;
}

const getMediaUrl = (path: string) => {
  return `http://localhost:5001/uploads/${path}`;
};

export function AlbumList({ albums, onAlbumClick, onCreateAlbum, onShowSettings, onEditAlbum, onUploadFiles }: Props) {
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortType>('newest');

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

  const sortedAlbums = useMemo(() => {
    let sorted = [...albums];
    switch (currentSort) {
      case 'category':
        return sorted.sort((a, b) => {
          if (!a.category || !b.category) return 0;
          return a.category.name.localeCompare(b.category.name);
        });
      case 'newest':
        return sorted.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'oldest':
        return sorted.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      default:
        return sorted;
    }
  }, [albums, currentSort]);

  const handleSortChange = (sort: SortType) => {
    setCurrentSort(sort);
    setShowSettingsModal(false);
  };

  const handleUploadFiles = async (albumId: number, files: FileList, password?: string) => {
    try {
      await onUploadFiles(albumId, files, password);
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
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
          <button className="action-btn upload-btn" onClick={() => setShowUploadModal(true)}>
            <span className="icon">📁</span> 上傳照片/視頻
          </button>
          <button className="action-btn" onClick={onCreateAlbum}>
            <span className="icon">➕</span> 創建相簿
          </button>
          <button className="action-btn" onClick={() => setShowCategoryModal(true)}>
            <span className="icon">🏷️</span> 管理類別
          </button>
          <button className="action-btn" onClick={() => setShowSettingsModal(true)}>
            <span className="icon">⚙️</span> 展示設置
          </button>
        </div>
      </div>

      <div className="albums-grid">
        {sortedAlbums.map((album) => (
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

      <CategoryManageModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
      />

      <DisplaySettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        currentSort={currentSort}
        onSortChange={handleSortChange}
      />

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        albums={albums}
        onUpload={handleUploadFiles}
      />
    </div>
  );
} 