import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

function FileUploader({ albumId, onUploadComplete }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const formData = new FormData();
    acceptedFiles.forEach(file => {
      formData.append('files', file);
    });

    fetch(`http://localhost:5001/api/albums/${albumId}/upload`, {
      method: 'POST',
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        alert('上傳成功！');
        onUploadComplete();
      })
      .catch(err => {
        console.error(err);
        alert('上傳失敗');
      });
      
  }, [albumId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div 
      {...getRootProps()} 
      style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center', cursor: 'pointer' }}
    >
      <input {...getInputProps()} />
      {isDragActive 
        ? <p>放手以上傳檔案</p> 
        : <p>拖曳檔案到這裡，或點擊選取檔案</p>
      }
    </div>
  );
}

export default FileUploader; 