import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      originalRequest._retry = true;
      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch (_refreshError) {
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/app')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Collection {
  _id: string;
  name: string;
  description?: string;
  documentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  _id: string;
  collectionId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: 'queued' | 'rendering' | 'parsing' | 'embedding' | 'ready' | 'failed';
  pageCount?: number;
  error?: string;
  createdAt: string;
}

export interface ThreadItem {
  _id: string;
  collectionId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Citation {
  id: string;
  documentId: string;
  documentTitle: string;
  page: number;
  chunkId: string;
  elementType: string;
  excerpt: string;
  bbox?: { x: number; y: number; width: number; height: number };
  pageImageRef?: string;
}

export interface MessageItem {
  _id: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  tables?: any[];
  charts?: any[];
  confidence?: 'high' | 'medium' | 'low';
  followups?: string[];
  latencyMs?: number;
  createdAt: string;
}

