import React, { useState, useMemo } from 'react';
import { Album } from '../types';
import { CreateAlbumModal } from './CreateAlbumModal';
import { CategoryManageModal } from './CategoryManageModal';
import { DisplaySettingsModal, SortType } from './DisplaySettingsModal';
import { UploadModal } from './UploadModal';
import { VideoThumbnail } from './VideoThumbnail';
import './AlbumList.css';

type ViewMode = 'albums' | 'photos' | 'videos';
type ViewSize = 'small' | 'medium' | 'large';

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
  const [viewMode, setViewMode] = useState<ViewMode>('albums');
  const [viewSize, setViewSize] = useState<ViewSize>('small');
  const [hoveredFile, setHoveredFile] = useState<number | null>(null);

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

  const handleDownload = (file: { path: string }) => {
    const link = document.createElement('a');
    link.href = getMediaUrl(file.path);
    link.download = file.path.split('/').pop() || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteFile = async (albumId: number, fileId: number) => {
    try {
      const response = await fetch(`http://localhost:5001/api/albums/${albumId}/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('刪除檔案失敗');
      }

      // 更新本地狀態
      const updatedAlbums = albums.map(album => {
        if (album.id === albumId) {
          return {
            ...album,
            files: album.files.filter(file => file.id !== fileId)
          };
        }
        return album;
      });

      // 更新相簿列表
      // TODO: 這裡需要通過 props 傳遞更新函數
    } catch (error) {
      console.error('刪除檔案失敗:', error);
    }
  };

  const getGridClass = () => {
    switch (viewSize) {
      case 'small':
        return 'size-small';
      case 'large':
        return 'size-large';
      default:
        return 'size-medium';
    }
  };

  const renderMediaGrid = (album: Album, mediaType: 'photo' | 'video') => {
    const mediaFiles = album.files.filter(file => {
      const isVideo = file.path.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/);
      return mediaType === 'video' ? isVideo : !isVideo;
    });

    if (mediaFiles.length === 0) return null;

    const displayFiles = mediaFiles.slice(0, 10);
    const remainingCount = mediaFiles.length - displayFiles.length;

    return (
      <div className="album-media-section" key={album.id}>
        <h3 className="album-title">{album.title}</h3>
        <div className={`media-grid ${getGridClass()}`}>
          {displayFiles.map((file, index) => (
            <div 
              key={file.id} 
              className="media-item"
              onMouseEnter={() => setHoveredFile(file.id)}
              onMouseLeave={() => setHoveredFile(null)}
            >
              {mediaType === 'video' ? (
                <VideoThumbnail 
                  file={file}
                  onDeleteFile={() => handleDeleteFile(album.id, file.id)}
                  onDownload={() => handleDownload(file)}
                  onClick={() => onAlbumClick(album)}
                />
              ) : (
                <>
                  <img src={getMediaUrl(file.path)} alt={file.path} onClick={() => onAlbumClick(album)} />
                  {hoveredFile === file.id && (
                    <div className="media-actions">
                      <button 
                        className="action-btn download"
                        onClick={() => handleDownload(file)}
                        title="下載"
                      >
                        ⬇️
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDeleteFile(album.id, file.id)}
                        title="刪除"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </>
              )}
              {index === displayFiles.length - 1 && remainingCount > 0 && (
                <div className="remaining-count">
                  其他{remainingCount}張
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'photos':
      case 'videos':
        return (
          <div className="media-view">
            <div className="view-controls">
              <div className="view-size-controls">
                <button
                  className={`size-btn ${viewSize === 'small' ? 'active' : ''}`}
                  onClick={() => setViewSize('small')}
                  title="小圖"
                >
                  <span className="icon">▫️</span>
                </button>
                <button
                  className={`size-btn ${viewSize === 'medium' ? 'active' : ''}`}
                  onClick={() => setViewSize('medium')}
                  title="中圖"
                >
                  <span className="icon">◽️</span>
                </button>
                <button
                  className={`size-btn ${viewSize === 'large' ? 'active' : ''}`}
                  onClick={() => setViewSize('large')}
                  title="大圖"
                >
                  <span className="icon">⬜️</span>
                </button>
              </div>
            </div>
            {sortedAlbums.map(album => renderMediaGrid(album, viewMode === 'videos' ? 'video' : 'photo'))}
          </div>
        );
      default:
        return (
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
        );
    }
  };

  return (
    <div className="album-list">
      <nav className="top-nav">
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${viewMode === 'albums' ? 'active' : ''}`}
            onClick={() => setViewMode('albums')}
          >
            相簿
          </button>
          <button 
            className={`nav-tab ${viewMode === 'photos' ? 'active' : ''}`}
            onClick={() => setViewMode('photos')}
          >
            照片
          </button>
          <button 
            className={`nav-tab ${viewMode === 'videos' ? 'active' : ''}`}
            onClick={() => setViewMode('videos')}
          >
            視頻
          </button>
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

      {renderContent()}

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