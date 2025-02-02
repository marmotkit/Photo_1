import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import FileUploader from './FileUploader';

function AlbumPage() {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5001/api/albums/${id}`)
      .then(res => res.json())
      .then(data => setAlbum(data));
  }, [id, refresh]);

  if (!album) return <p>載入中...</p>;

  return (
    <div>
      <h2>{album.title}</h2>
      <p><strong>日期:</strong> {album.date}</p>
      <p>{album.description}</p>
      <hr />
      <h3>上傳媒體</h3>
      <FileUploader albumId={id} onUploadComplete={() => setRefresh(!refresh)} />
      <hr />
      <h3>媒體列表</h3>
      {album.files && album.files.length > 0 ? (
        <ul>
          {album.files.map((file, index) => (
            <li key={index}>
              {file.originalname.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img src={`http://localhost:5001/uploads/${file.filename}`} alt={file.originalname} style={{ width: 100 }} />
              ) : (
                <span>{file.originalname}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>尚無上傳媒體</p>
      )}
    </div>
  );
}

export default AlbumPage; 