import { useState, useEffect, useRef } from 'react'
import { CreateAlbumModal } from './components/CreateAlbumModal'
import { AlbumDetail } from './components/AlbumDetail'
import { AlbumList } from './components/AlbumList'
import { Album, AlbumAccess, PermissionType } from './types'
import './App.css'
import React from 'react'

interface AlbumFile {
  id: number;
  path: string;
  isCover?: boolean;
}

function App() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [passwordDialog, setPasswordDialog] = useState<{
    albumId: number;
    onSuccess: () => void;
  } | null>(null)
  const [password, setPassword] = useState('')
  const [albumAccess, setAlbumAccess] = useState<AlbumAccess[]>([])
  const [activeTab, setActiveTab] = useState<'albums' | 'photos' | 'videos'>('albums')

  useEffect(() => {
    fetchAlbums()
  }, [])

  const fetchAlbums = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/albums')
      if (!response.ok) {
        throw new Error('獲取相簿失敗')
      }
      const data = await response.json()
      setAlbums(data)
      setError(null)
    } catch (error) {
      console.error('獲取相簿失敗:', error)
      setError('無法載入相簿，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAlbum = async (albumData: {
    title: string
    date: string
    description: string
    isPublic: boolean
    hasPassword: boolean
    password?: string
  }) => {
    try {
      const response = await fetch('http://localhost:5001/api/albums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(albumData),
      })
      if (!response.ok) {
        throw new Error('建立相簿失敗')
      }
      const newAlbum = await response.json()
      setAlbums([...albums, newAlbum])
      setIsCreateModalOpen(false)
      setError(null)
    } catch (error) {
      console.error('建立相簿失敗:', error)
      setError('建立相簿時發生錯誤，請稍後再試')
    }
  }

  const handleAlbumClick = (album: Album) => {
    if (album.hasPassword && !albumAccess.find(a => a.albumId === album.id)?.accessGranted) {
      setPasswordDialog({
        albumId: album.id,
        onSuccess: () => {
          setSelectedAlbum(album)
          setPasswordDialog(null)
          setPassword('')
        }
      })
    } else {
      setSelectedAlbum(album)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordDialog) return

    try {
      const response = await fetch(`http://localhost:5001/api/albums/${passwordDialog.albumId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        setAlbumAccess([
          ...albumAccess,
          { albumId: passwordDialog.albumId, accessGranted: true }
        ])
        passwordDialog.onSuccess()
      } else {
        setError('密碼錯誤')
      }
    } catch (error) {
      console.error('驗證密碼失敗:', error)
      setError('驗證密碼時發生錯誤')
    }
  }

  const handleDeleteAlbum = async () => {
    if (!selectedAlbum) return

    try {
      const response = await fetch(`http://localhost:5001/api/albums/${selectedAlbum.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('刪除相簿失敗')
      }
      setAlbums(albums.filter(album => album.id !== selectedAlbum.id))
      setSelectedAlbum(null)
      setError(null)
    } catch (error) {
      console.error('刪除相簿失敗:', error)
      setError('刪除相簿時發生錯誤，請稍後再試')
    }
  }

  const handleUploadPhotos = async (files: FileList) => {
    if (!selectedAlbum) return

    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('files', file)
    })

    try {
      const response = await fetch(`http://localhost:5001/api/albums/${selectedAlbum.id}/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        throw new Error('上傳照片失敗')
      }
      const data = await response.json()
      
      const updatedAlbum = {
        ...selectedAlbum,
        files: [...selectedAlbum.files, ...data.files],
      }
      setSelectedAlbum(updatedAlbum)
      setAlbums(albums.map(album => 
        album.id === selectedAlbum.id ? updatedAlbum : album
      ))
      setError(null)
    } catch (error) {
      console.error('上傳照片失敗:', error)
      setError('上傳照片時發生錯誤，請稍後再試')
    }
  }

  const handleSetCover = async (albumId: number, fileId: number) => {
    try {
      const response = await fetch(`http://localhost:5001/api/albums/${albumId}/cover`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        throw new Error('設置封面失敗');
      }

      // 更新本地狀態
      const updatedAlbums = albums.map(album => {
        if (album.id === albumId) {
          return {
            ...album,
            files: album.files.map(file => ({
              ...file,
              isCover: file.id === fileId
            }))
          };
        }
        return album;
      });

      setAlbums(updatedAlbums);
      
      if (selectedAlbum?.id === albumId) {
        setSelectedAlbum(updatedAlbums.find(a => a.id === albumId) || null);
      }

      setError(null);
    } catch (error) {
      console.error('設置封面失敗:', error);
      setError('設置封面時發生錯誤，請稍後再試');
    }
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

      setAlbums(updatedAlbums);
      
      if (selectedAlbum?.id === albumId) {
        setSelectedAlbum(updatedAlbums.find(a => a.id === albumId) || null);
      }

      setError(null);
    } catch (error) {
      console.error('刪除檔案失敗:', error);
      setError('刪除檔案時發生錯誤，請稍後再試');
    }
  };

  const handleUpdatePermissions = async (
    albumId: number,
    permissions: {
      isPublic: boolean;
      hasPassword: boolean;
      password?: string;
      permissionType?: PermissionType;
    }
  ) => {
    try {
      const response = await fetch(`http://localhost:5001/api/albums/${albumId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(permissions),
      });

      if (!response.ok) {
        throw new Error('更新權限失敗');
      }

      const updatedAlbum = await response.json();

      // 更新本地狀態
      const updatedAlbums = albums.map(album => 
        album.id === albumId ? updatedAlbum : album
      );

      setAlbums(updatedAlbums);
      
      if (selectedAlbum?.id === albumId) {
        setSelectedAlbum(updatedAlbum);
      }

      setError(null);
    } catch (error) {
      console.error('更新權限失敗:', error);
      setError('更新權限時發生錯誤，請稍後再試');
      throw error;
    }
  };

  const VideoThumbnail = ({ file }: { file: { path: string } }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const generateThumbnail = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            try {
              const dataUrl = canvas.toDataURL('image/jpeg');
              setThumbnailUrl(dataUrl);
              setError(false);
            } catch (error) {
              console.error('生成縮圖失敗:', error);
              setError(true);
            }
          }
        } catch (error) {
          console.error('生成縮圖失敗:', error);
          setError(true);
        } finally {
          setIsLoading(false);
        }
      };

      const handleLoadedMetadata = () => {
        video.currentTime = 0.1;
      };

      const handleSeeked = () => {
        generateThumbnail();
      };

      const handleError = (e: any) => {
        console.error('影片載入失敗:', e);
        setError(true);
        setIsLoading(false);
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('seeked', handleSeeked);
      video.addEventListener('error', handleError);

      // 設置影片來源
      video.src = getMediaUrl(file.path);
      video.load();

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('error', handleError);
        video.src = ''; // 清除影片來源
      };
    }, [file.path]);

    return (
      <div className={`thumbnail video ${isLoading ? 'loading' : ''}`}>
        <video
          ref={videoRef}
          style={{ display: 'none' }}
          preload="metadata"
          muted
          playsInline
          crossOrigin="anonymous"
        />
        {!error && thumbnailUrl ? (
          <img src={thumbnailUrl} alt="影片縮圖" />
        ) : (
          <div className="video-placeholder">
            <span className="icon">🎥</span>
          </div>
        )}
      </div>
    );
  };

  const getMediaUrl = (path: string) => {
    return `http://localhost:5001/uploads/${path}`;
  };

  return (
    <div className="app">
      {selectedAlbum ? (
        <AlbumDetail
          album={selectedAlbum}
          onClose={() => setSelectedAlbum(null)}
          onUpload={handleUploadPhotos}
          onDelete={handleDeleteAlbum}
          onSetCover={(fileId) => handleSetCover(selectedAlbum.id, fileId)}
          onDeleteFile={(fileId) => handleDeleteFile(selectedAlbum.id, fileId)}
          onUpdatePermissions={(permissions) => handleUpdatePermissions(selectedAlbum.id, permissions)}
        />
      ) : (
        <>
          <AlbumList
            albums={albums}
            onAlbumClick={handleAlbumClick}
            onCreateAlbum={() => setIsCreateModalOpen(true)}
            onShowSettings={() => {/* TODO: 實現展示設置 */}}
          />
          <CreateAlbumModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleCreateAlbum}
          />
        </>
      )}

      {/* Password Dialog */}
      {passwordDialog && (
        <div className="modal-overlay">
          <div className="password-modal">
            <h3>請輸入密碼</h3>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="輸入相簿密碼"
              />
              {error && <p className="error-message">{error}</p>}
              <div className="modal-actions">
                <button type="button" onClick={() => setPasswordDialog(null)}>
                  取消
                </button>
                <button type="submit">確認</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
