import React from 'react';
import './Modal.css';

export type SortType = 'category' | 'newest' | 'oldest';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentSort: SortType;
  onSortChange: (sort: SortType) => void;
}

export function DisplaySettingsModal({ isOpen, onClose, currentSort, onSortChange }: Props) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>展示設置</h2>
          <button className="close-icon" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="settings-section">
            <h3>排序方式</h3>
            <div className="sort-options">
              <label className="sort-option">
                <input
                  type="radio"
                  name="sort"
                  value="category"
                  checked={currentSort === 'category'}
                  onChange={(e) => onSortChange('category')}
                />
                <div className="sort-info">
                  <span className="sort-title">依類別排序</span>
                  <span className="sort-description">相簿將按類別名稱排序</span>
                </div>
              </label>

              <label className="sort-option">
                <input
                  type="radio"
                  name="sort"
                  value="newest"
                  checked={currentSort === 'newest'}
                  onChange={(e) => onSortChange('newest')}
                />
                <div className="sort-info">
                  <span className="sort-title">最新創建在前</span>
                  <span className="sort-description">最近創建的相簿將顯示在最前面</span>
                </div>
              </label>

              <label className="sort-option">
                <input
                  type="radio"
                  name="sort"
                  value="oldest"
                  checked={currentSort === 'oldest'}
                  onChange={(e) => onSortChange('oldest')}
                />
                <div className="sort-info">
                  <span className="sort-title">最新創建在後</span>
                  <span className="sort-description">最早創建的相簿將顯示在最前面</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 