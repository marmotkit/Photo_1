import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AlbumList from './components/AlbumList';
import AlbumPage from './components/AlbumPage';

function App() {
  return (
    <Router>
      <div>
        <nav style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
          <Link to="/" style={{ marginRight: 10 }}>首頁</Link>
        </nav>
        <div style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={<AlbumList />} />
            <Route path="/albums/:id" element={<AlbumPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;