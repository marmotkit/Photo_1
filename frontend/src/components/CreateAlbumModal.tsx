import React, { useState, useEffect } from 'react'
import { Album, AlbumCategory } from '../types'
import './Modal.css'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (albumData: {
    title: string
    date: string
    description: string
    isPublic: boolean
    hasPassword: boolean
    password?: string
    categoryId: number
  }) => void
  editingAlbum?: Album
}

export function CreateAlbumModal({ isOpen, onClose, onSubmit, editingAlbum }: Props) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [hasPassword, setHasPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [categoryId, setCategoryId] = useState(1) // 默認使用 "通用" 類別
  const [categories, setCategories] = useState<AlbumCategory[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (editingAlbum) {
      setTitle(editingAlbum.title)
      setDate(editingAlbum.date || '')
      setDescription(editingAlbum.description || '')
      setIsPublic(editingAlbum.isPublic)
      setHasPassword(editingAlbum.hasPassword || false)
      setCategoryId(editingAlbum.categoryId || 1)
      setPassword('')
    } else {
      setTitle('')
      setDate('')
      setDescription('')
      setIsPublic(true)
      setHasPassword(false)
      setPassword('')
      setCategoryId(1)
    }
  }, [editingAlbum, isOpen])

  useEffect(() => {
    // 獲取所有類別
    fetch('http://localhost:5001/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('獲取類別失敗:', err))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('請輸入相簿標題')
      return
    }
    if (hasPassword && !password.trim()) {
      setError('請設定密碼')
      return
    }
    onSubmit({ 
      title, 
      date, 
      description, 
      isPublic, 
      hasPassword,
      password: hasPassword ? password : undefined,
      categoryId
    })
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{editingAlbum ? '編輯相簿' : '創建相簿'}</h2>
          <button className="close-icon" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">相簿標題</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="輸入相簿標題"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">類別</label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(parseInt(e.target.value))}
              required
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="date">建立日期</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">相簿描述</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述這個相簿..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
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
              <span>公開相簿</span>
            </label>
          </div>

          {!isPublic && (
            <div className="form-group">
              <label className="checkbox-label">
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
                <span>設定密碼保護</span>
              </label>
              
              {hasPassword && (
                <div className="password-input">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="輸入相簿密碼"
                    className="mt-2"
                  />
                </div>
              )}
            </div>
          )}

          {error && <p className="error-message">{error}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              取消
            </button>
            <button type="submit" className="submit-btn">
              {editingAlbum ? '保存' : '創建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 