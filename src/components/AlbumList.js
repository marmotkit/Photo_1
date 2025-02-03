import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function AlbumList() {
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5001/api/albums')
      .then(res => res.json())
      .then(data => setAlbums(data));
  }, []);

  return (
    <div>
      <h2>相簿列表</h2>
      <Link to="#" onClick={() => {
        const title = prompt('請輸入相簿名稱');
        const date = prompt('請輸入活動日期');
        const description = prompt('請輸入描述');
        fetch('http://localhost:5001/api/albums', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, date, description })
        })
          .then(res => res.json())
          .then(newAlbum => setAlbums(prev => [...prev, newAlbum]));
      }}>
        建立新相簿
      </Link>
      <div style={{ marginTop: '20px' }}>
        {albums.length === 0 
          ? <p>尚無相簿</p> 
          : (
            <ul>
              {albums.map(album => (
                <li key={album.id}>
                  <Link to={`/albums/${album.id}`}>{album.title} ({album.date})</Link>
                </li>
              ))}
            </ul>
        )}
      </div>
    </div>
  );
}

export default AlbumList; 