import React, { useState, useEffect } from 'react';
import { AlbumCategory } from '../types';
import './Modal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryManageModal({ isOpen, onClose }: Props) {
  const [categories, setCategories] = useState<AlbumCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<AlbumCategory | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('獲取類別失敗:', err);
      setError('獲取類別失敗');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('請輸入類別名稱');
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategoryName }),
      });

      if (response.ok) {
        const newCategory = await response.json();
        setCategories([...categories, newCategory]);
        setNewCategoryName('');
        setError('');
      } else {
        setError('新增類別失敗');
      }
    } catch (err) {
      console.error('新增類別失敗:', err);
      setError('新增類別失敗');
    }
  };

  const handleUpdateCategory = async (category: AlbumCategory) => {
    if (!editingCategory?.name.trim()) {
      setError('請輸入類別名稱');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editingCategory.name }),
      });

      if (response.ok) {
        const updatedCategory = await response.json();
        setCategories(categories.map(c => 
          c.id === updatedCategory.id ? updatedCategory : c
        ));
        setEditingCategory(null);
        setError('');
      } else {
        setError('更新類別失敗');
      }
    } catch (err) {
      console.error('更新類別失敗:', err);
      setError('更新類別失敗');
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      const response = await fetch(`http://localhost:5001/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCategories(categories.filter(c => c.id !== categoryId));
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || '刪除類別失敗');
      }
    } catch (err) {
      console.error('刪除類別失敗:', err);
      setError('刪除類別失敗');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>管理類別</h2>
          <button className="close-icon" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body" style={{ padding: '2rem' }}>
          {/* 新增類別 */}
          <div className="form-group">
            <div className="category-input-group">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="輸入新類別名稱"
                className="category-input"
              />
              <button 
                onClick={handleAddCategory}
                className="add-category-btn"
              >
                新增類別
              </button>
            </div>
          </div>

          {/* 類別列表 */}
          <div className="categories-list">
            {categories.map(category => (
              <div key={category.id} className="category-item">
                {editingCategory?.id === category.id ? (
                  <div className="category-edit-group">
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({
                        ...editingCategory,
                        name: e.target.value
                      })}
                      className="category-input"
                    />
                    <button 
                      onClick={() => handleUpdateCategory(category)}
                      className="save-category-btn"
                    >
                      保存
                    </button>
                    <button 
                      onClick={() => setEditingCategory(null)}
                      className="cancel-category-btn"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div className="category-view-group">
                    <span className="category-name">{category.name}</span>
                    <div className="category-actions">
                      <button 
                        onClick={() => setEditingCategory(category)}
                        className="edit-category-btn"
                        disabled={category.id === 1}
                      >
                        編輯
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(category.id)}
                        className="delete-category-btn"
                        disabled={category.id === 1}
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    </div>
  );
} 