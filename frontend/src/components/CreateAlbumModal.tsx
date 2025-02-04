import React, { useState } from 'react'
import { Album } from '../types'
import './CreateAlbumModal.css'

interface CreateAlbumModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (albumData: {
    title: string
    date: string
    description: string
    isPublic: boolean
    hasPassword: boolean
    password?: string
  }) => Promise<void>
  editingAlbum?: Album
}

export function CreateAlbumModal({ isOpen, onClose, onSubmit, editingAlbum }: CreateAlbumModalProps) {
  const [title, setTitle] = useState(editingAlbum?.title || '')
  const [date, setDate] = useState(editingAlbum?.date || '')
  const [description, setDescription] = useState(editingAlbum?.description || '')
  const [isPublic, setIsPublic] = useState(editingAlbum?.isPublic || false)
  const [hasPassword, setHasPassword] = useState(editingAlbum?.hasPassword || false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 當編輯的相簿改變時，更新表單狀態
  React.useEffect(() => {
    if (editingAlbum) {
      setTitle(editingAlbum.title)
      setDate(editingAlbum.date)
      setDescription(editingAlbum.description)
      setIsPublic(editingAlbum.isPublic)
      setHasPassword(editingAlbum.hasPassword)
    }
  }, [editingAlbum])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (!title.trim()) {
        throw new Error('請輸入相簿標題')
      }

      if (hasPassword && !password.trim()) {
        throw new Error('請輸入密碼')
      }

      await onSubmit({
        title: title.trim(),
        date,
        description: description.trim(),
        isPublic,
        hasPassword,
        password: hasPassword ? password : undefined
      })

      // 重置表單
      setTitle('')
      setDate('')
      setDescription('')
      setIsPublic(false)
      setHasPassword(false)
      setPassword('')
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : '創建相簿失敗')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>創建新相簿</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">相簿標題</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">日期</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">描述</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              公開相簿
            </label>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={hasPassword}
                onChange={(e) => setHasPassword(e.target.checked)}
              />
              設置密碼
            </label>
          </div>

          {hasPassword && (
            <div className="form-group">
              <label htmlFor="password">密碼</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={isLoading}>
              取消
            </button>
            <button type="submit" disabled={isLoading}>
              {isLoading ? '創建中...' : '創建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 