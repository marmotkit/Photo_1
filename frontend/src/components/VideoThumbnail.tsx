import React, { useState, useRef } from 'react';
import './AlbumList.css';

interface Props {
  file: {
    id: number;
    path: string;
  };
  onDeleteFile: () => void;
  onDownload: () => void;
  onClick: () => void;
}

export function VideoThumbnail({ file, onDeleteFile, onDownload, onClick }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hovering, setHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getMediaUrl = (path: string) => {
    return `http://localhost:5001/uploads/${path}`;
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleMouseEnter = () => {
    setHovering(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    setHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div 
      className="video-thumbnail"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={getMediaUrl(file.path)}
        muted
        loop
        playsInline
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          cursor: 'pointer'
        }}
        onClick={onClick}
      />
      {!isPlaying && (
        <button 
          className="play-icon"
          onClick={handlePlayClick}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ▶️
        </button>
      )}
      
      {hovering && (
        <div className="media-actions">
          <button 
            className="action-btn play"
            onClick={handlePlayClick}
            title={isPlaying ? "暫停" : "播放"}
          >
            {isPlaying ? "⏸️" : "▶️"}
          </button>
          <button 
            className="action-btn download"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            title="下載"
          >
            ⬇️
          </button>
          <button 
            className="action-btn delete"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFile();
            }}
            title="刪除"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
} 