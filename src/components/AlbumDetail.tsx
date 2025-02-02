import React, { useState, useRef, useEffect } from 'react'
import { Album } from '../types'
import './AlbumDetail.css'
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

type ViewSize = 'small' | 'medium' | 'large';

type PermissionType = 'view' | 'modify' | 'readonly' | 'full';

interface Props {
  album: Album
  onClose: () => void
  onUpload: (files: FileList) => void
  onDelete: () => void
  onSetCover: (fileId: number) => Promise<void>
  onDeleteFile: (fileId: number) => Promise<void>
  onUpdatePermissions: (permissions: { 
    isPublic: boolean; 
    hasPassword: boolean;
    password?: string;
    permissionType?: PermissionType 
  }) => Promise<void>
}

const formatFileName = (path: string) => {
  const fileName = path.split('/').pop() || '';
  const name = fileName.split('.')[0];
  const ext = fileName.split('.').pop();
  
  if (name.length <= 12) {
    return fileName;
  }
  
  return `${name.slice(0, 12)}...${ext}`;
};

const VideoThumbnail = ({ file }: { file: { path: string; id: number } }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnailReady, setThumbnailReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      video.currentTime = 0.1;  // 設置到第一幀
      setThumbnailReady(true);
    };

    video.addEventListener('loadeddata', handleLoadedData);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = getMediaUrl(file.path);
    link.download = file.path.split('/').pop() || 'video.mov';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="media-item video">
      <div className="video-preview" onClick={handleClick}>
        {isPlaying ? (
          <video
            src={getMediaUrl(file.path)}
            controls
            autoPlay
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        ) : (
          <>
            <video
              ref={videoRef}
              src={getMediaUrl(file.path)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: thumbnailReady ? 1 : 0
              }}
              preload="auto"
              muted
              playsInline
            />
            {!thumbnailReady && (
              <div className="video-placeholder">
                <span className="icon">🎥</span>
              </div>
            )}
            <div className="video-overlay" style={{ opacity: thumbnailReady ? 1 : 0 }}>
              <span className="play-icon">▶️</span>
            </div>
            <div className="media-actions">
              <button 
                className="action-btn play"
                onClick={handleClick}
                title="播放"
              >
                ▶️
              </button>
              <button 
                className="action-btn download"
                onClick={handleDownload}
                title="下載"
              >
                ⬇️
              </button>
            </div>
          </>
        )}
      </div>
      <div className="media-title" title={file.path.split('/').pop()}>
        {formatFileName(file.path)}
      </div>
    </div>
  );
};

const getMediaUrl = (path: string) => {
  return `http://localhost:5001/uploads/${path}`;
};

export function AlbumDetail({ 
  album, 
  onClose, 
  onUpload, 
  onDelete, 
  onSetCover, 
  onDeleteFile,
  onUpdatePermissions 
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [viewSize, setViewSize] = useState<ViewSize>('small')
  const [hoveredFile, setHoveredFile] = useState<number | null>(null)
  const [showPermissions, setShowPermissions] = useState(false)
  const [isPublic, setIsPublic] = useState(album.isPublic)
  const [hasPassword, setHasPassword] = useState(album.hasPassword)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [permissionType, setPermissionType] = useState<PermissionType>(album.permissionType || 'view')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isPublic) {
      setPermissionType('full')
      setHasPassword(false)
      setPassword('')
    }
  }, [isPublic])

  const handlePermissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onUpdatePermissions({
        isPublic,
        hasPassword,
        password: isEditingPassword ? password : undefined,
        permissionType: isPublic ? 'full' : permissionType
      })

      setShowPermissions(false)
      setError(null)
      setIsEditingPassword(false)
    } catch (error) {
      setError('更新權限失敗')
    }
  }

  const getPermissionDescription = (type: PermissionType) => {
    switch (type) {
      case 'view':
        return '只能查看相簿內容'
      case 'readonly':
        return '可以查看和下載，但不能修改'
      case 'modify':
        return '可以上傳和刪除照片，但不能更改權限'
      case 'full':
        return '完整權限，包括更改相簿設置'
      default:
        return ''
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      onUpload(files)
    }
  }

  const handleDownload = (file: { path: string }) => {
    const link = document.createElement('a')
    link.href = getMediaUrl(file.path)
    link.download = file.path.split('/').pop() || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getGridClass = () => {
    switch (viewSize) {
      case 'small':
        return 'size-small'
      case 'large':
        return 'size-large'
      default:
        return 'size-medium'
    }
  }

  return (
    <div className="album-detail">
      <div className="album-header">
        <h2>{album.title}</h2>
        <div className="album-actions">
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
          <button 
            className="permission-btn"
            onClick={() => setShowPermissions(true)}
            title="權限設置"
          >
            <span className="icon">🔒</span>
            權限設置
          </button>
          <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
            上傳照片/影片
          </button>
          <button className="delete-btn" onClick={onDelete}>
            刪除相簿
          </button>
          <button className="close-btn" onClick={onClose}>
            關閉
          </button>
        </div>
      </div>

      {/* 權限設置對話框 */}
      {showPermissions && (
        <div className="modal-overlay">
          <div className="permission-modal">
            <h3>權限設置</h3>
            <form onSubmit={handlePermissionSubmit}>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => {
                      setIsPublic(e.target.checked)
                      if (e.target.checked) {
                        setHasPassword(false)
                        setPassword('')
                      }
                    }}
                  />
                  公開相簿
                </label>
                <p className="help-text">公開相簿可以被任何人查看</p>
              </div>

              {!isPublic && (
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={hasPassword}
                      onChange={(e) => {
                        setHasPassword(e.target.checked)
                        if (!e.target.checked) {
                          setPassword('')
                        }
                      }}
                    />
                    需要密碼
                  </label>

                  {hasPassword && (
                    <div className="password-section">
                      {!isEditingPassword ? (
                        <div className="password-display">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={album.currentPassword || "********"}
                            readOnly
                            className="password-input"
                          />
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? "隱藏密碼" : "顯示密碼"}
                          >
                            {showPassword ? "👁️" : "👁️‍🗨️"}
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => setIsEditingPassword(true)}
                            title="修改密碼"
                          >
                            ✏️
                          </button>
                        </div>
                      ) : (
                        <div className="password-edit">
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="輸入新密碼"
                            className="password-input"
                          />
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => {
                              setIsEditingPassword(false)
                              setPassword('')
                            }}
                            title="取消修改"
                          >
                            ❌
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!isPublic && (
                <div className="form-group permission-options">
                  <label className="permission-label">權限等級</label>
                  {(['view', 'readonly', 'modify', 'full'] as PermissionType[]).map((type) => (
                    <div key={type} className="permission-option">
                      <label>
                        <input
                          type="radio"
                          name="permissionType"
                          value={type}
                          checked={isPublic ? type === 'full' : permissionType === type}
                          onChange={(e) => setPermissionType(e.target.value as PermissionType)}
                          disabled={isPublic}
                        />
                        <div className="permission-info">
                          <span className="permission-title">
                            {type === 'view' && '基本查看'}
                            {type === 'readonly' && '唯讀訪問'}
                            {type === 'modify' && '修改權限'}
                            {type === 'full' && '完整權限'}
                          </span>
                          <span className="permission-description">
                            {getPermissionDescription(type)}
                          </span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {error && <p className="error-message">{error}</p>}
              <div className="modal-actions">
                <button type="button" onClick={() => setShowPermissions(false)} className="cancel-btn">
                  取消
                </button>
                <button type="submit" className="submit-btn">
                  確認
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={`media-grid ${getGridClass()}`}>
        {album.files.map((file) => (
          <div 
            key={file.id} 
            className="media-container"
            onMouseEnter={() => setHoveredFile(file.id)}
            onMouseLeave={() => setHoveredFile(null)}
          >
            {file.path.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) ? (
              <VideoThumbnail file={file} />
            ) : (
              <>
                <div className="media-item">
                  <img
                    src={getMediaUrl(file.path)}
                    alt={file.path}
                    loading="lazy"
                  />
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
                        className="action-btn set-cover"
                        onClick={() => onSetCover(file.id)}
                        title="設為封面"
                      >
                        ⭐️
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => onDeleteFile(file.id)}
                        title="刪除"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                  {file.isCover && (
                    <div className="cover-badge">封面</div>
                  )}
                </div>
                <div className="media-title" title={file.path.split('/').pop()}>
                  {formatFileName(file.path)}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        multiple
        accept="image/*,video/*"
      />
    </div>
  )
} 