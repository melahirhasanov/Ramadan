import api from './api';

export interface Volunteer {
  person_id?: string;
  free_time: string;
  teams: string[];
  image: string;
  notes: string;
}

export interface Idea {
  _id?: string;
  category: string;
  title: string;
  description: string;
  images: string[];
  links: string[];
  is_approved?: boolean;
  likes?: string[];
  volunteer_id?: string | { _id: string; full_name: string };
  created_at?: string;
  updated_at?: string;
}

export const volunteerService = {
  // ═══════════════════════════════════════════════════════════
  // VOLUNTEER CRUD
  // ═══════════════════════════════════════════════════════════
  getAll: () => api.get('/volunteers'),
  getById: (id: string) => api.get(`/volunteers/profile/${id}`),
  create: (data: any) => api.post('/volunteers', data),
  update: (id: string, data: Partial<Volunteer>) => api.put(`/volunteers/profile/${id}`, data),
  delete: (id: string) => api.delete(`/volunteers/${id}`),
  
  // ═══════════════════════════════════════════════════════════
  // VOLUNTEER ACTIVATION/DEACTIVATION
  // ═══════════════════════════════════════════════════════════
  deactivate: (id: string, deactivated_until?: string) => 
    api.put(`/volunteers/${id}/deactivate`, { deactivated_until }),
  activate: (id: string) => 
    api.put(`/volunteers/${id}/activate`, {}),
  
  // ═══════════════════════════════════════════════════════════
  // IDEAS CRUD
  // ═══════════════════════════════════════════════════════════
  createIdea: (idea: Idea) => api.post('/volunteers/ideas', idea),
  getAllIdeas: () => api.get('/volunteers/ideas'),
  getIdeaById: (id: string) => api.get(`/volunteers/ideas/${id}`),  // YENİ
  updateIdea: (id: string, idea: Partial<Idea>) => api.put(`/volunteers/ideas/${id}`, idea),  // YENİ
  deleteIdea: (id: string) => api.delete(`/volunteers/ideas/${id}`),  // YENİ
  
  // ═══════════════════════════════════════════════════════════
  // IDEAS ACTIONS
  // ═══════════════════════════════════════════════════════════
  approveIdea: (id: string) => api.put(`/volunteers/ideas/${id}/approve`),
  likeIdea: (id: string) => api.post(`/volunteers/ideas/${id}/like`),
  unlikeIdea: (id: string) => api.delete(`/volunteers/ideas/${id}/like`),
};