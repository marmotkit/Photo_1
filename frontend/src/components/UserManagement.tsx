import React, { useState, useEffect } from 'react';
import './UserManagement.css';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  permissions: {
    canCreateAlbum: boolean;
    canEditAlbum: boolean;
    canDeleteAlbum: boolean;
    canUploadFiles: boolean;
    canDeleteFiles: boolean;
    canManageUsers: boolean;
    canManageGroups: boolean;
  };
}

interface UserFormData {
  _id?: string;
  username: string;
  email: string;
  password?: string;
  role: string;
  isActive: boolean;
  permissions: {
    canCreateAlbum: boolean;
    canEditAlbum: boolean;
    canDeleteAlbum: boolean;
    canUploadFiles: boolean;
    canDeleteFiles: boolean;
    canManageUsers: boolean;
    canManageGroups: boolean;
  };
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    role: 'user',
    isActive: true,
    permissions: {
      canCreateAlbum: true,
      canEditAlbum: true,
      canDeleteAlbum: true,
      canUploadFiles: true,
      canDeleteFiles: true,
      canManageUsers: false,
      canManageGroups: false
    }
  });

  // 獲取用戶列表
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('獲取用戶列表失敗');
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : '獲取用戶列表失敗');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      console.log('提交表單數據:', {
        editingUser,
        formData,
        isEditing: !!editingUser
      });

      // 檢查編輯模式下是否有有效的用戶 ID
      if (editingUser && !editingUser._id) {
        console.error('缺少用戶 ID:', editingUser);
        throw new Error('無效的用戶 ID');
      }

      const url = editingUser 
        ? `http://localhost:5001/api/users/${editingUser._id}`
        : 'http://localhost:5001/api/users';
      
      const method = editingUser ? 'PUT' : 'POST';

      // 創建要發送的數據
      const dataToSend: Partial<UserFormData> = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
        permissions: formData.permissions
      };

      // 只在創建新用戶時添加密碼
      if (!editingUser && formData.password) {
        dataToSend.password = formData.password;
      }

      console.log('發送請求:', {
        url,
        method,
        data: dataToSend,
        editingUserId: editingUser?._id
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || (editingUser ? '更新用戶失敗' : '創建用戶失敗'));
      }

      await fetchUsers();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('操作失敗:', error);
      setError(error instanceof Error ? error.message : '操作失敗');
    }
  };

  // 處理刪除用戶
  const handleDelete = async (userId: string) => {
    if (!window.confirm('確定要刪除此用戶嗎？')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('刪除用戶失敗');
      }

      await fetchUsers();
    } catch (error) {
      setError(error instanceof Error ? error.message : '刪除用戶失敗');
    }
  };

  // 重置表單
  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'user',
      isActive: true,
      permissions: {
        canCreateAlbum: true,
        canEditAlbum: true,
        canDeleteAlbum: true,
        canUploadFiles: true,
        canDeleteFiles: true,
        canManageUsers: false,
        canManageGroups: false
      }
    });
    setEditingUser(null);
  };

  // 開始編輯用戶
  const handleEdit = (user: User | any) => {
    console.log('原始用戶數據:', user);

    const userId = user._id || user.id;  // 同時支持 _id 和 id
    if (!userId) {
      console.error('用戶缺少 ID');
      setError('無效的用戶數據');
      return;
    }

    const editingUserData: User = {
      _id: userId,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      permissions: { ...user.permissions }
    };

    console.log('開始編輯用戶:', editingUserData);

    setEditingUser(editingUserData);
    setFormData({
      _id: userId,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      permissions: { ...user.permissions }
    });
    setShowForm(true);
  };

  if (isLoading) return <div className="loading">載入中...</div>;

  return (
    <div className="user-management">
      <div className="header">
        <h2>用戶管理</h2>
        <button 
          className="add-button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          新增用戶
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h3>{editingUser ? '編輯用戶' : '新增用戶'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>用戶名</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>電子郵件</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              {!editingUser && (
                <div className="form-group">
                  <label>密碼</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>角色</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="user">一般用戶</option>
                  <option value="admin">管理員</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  帳號啟用
                </label>
              </div>

              <h4>權限設定</h4>
              <div className="permissions-grid">
                {Object.entries(formData.permissions).map(([key, value]) => (
                  <label key={`permission-${key}`}>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          [key]: e.target.checked
                        }
                      })}
                    />
                    {key}
                  </label>
                ))}
              </div>

              <div className="form-actions">
                <button type="submit">
                  {editingUser ? '更新' : '創建'}
                </button>
                <button type="button" onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}>
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="users-list">
        <table>
          <thead>
            <tr>
              <th>用戶名</th>
              <th>電子郵件</th>
              <th>角色</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role === 'admin' ? '管理員' : '一般用戶'}</td>
                <td>{user.isActive ? '啟用' : '停用'}</td>
                <td>
                  <button 
                    className="edit-button"
                    onClick={() => handleEdit(user)}
                  >
                    編輯
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDelete(user._id)}
                  >
                    刪除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 