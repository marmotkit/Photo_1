export interface User {
  id: number
  username: string
  email: string
  avatar?: string
}

export type PermissionType = 'view' | 'modify' | 'readonly' | 'full';

export interface Album {
  id: number
  title: string
  date: string
  description: string
  cover: string
  files: AlbumFile[]
  ownerId: number
  isPublic: boolean
  permissionType: PermissionType
  hasPassword: boolean
  password?: string
  currentPassword?: string
  thumbnailCount: number
  createdAt: string
  updatedAt: string
}

export interface AlbumFile {
  id: number
  path: string
  originalname?: string
  isCover?: boolean
}

export interface AlbumAccess {
  albumId: number
  accessGranted: boolean
}

export interface AlbumPermission {
  userId: number
  albumId: number
  permissionType: PermissionType
  user: User
} 