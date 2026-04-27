import api from './api';

export interface FamilyMember {
  name: string;
  gender: string;
  age: number;
  needs_spiritual_support?: boolean;
  spiritual_support_reason?: string;
}

export interface FamilyNeed {
  category: 'geyim' | 'qida' | 'derman' | 'tehsil';
  description: string;
  medicine_image?: string;
  is_fulfilled?: boolean;
}

export interface Family {
  _id?: string;
  name: string;
  contact_phone: string;
  address: string;
  exact_address?: string;
  child_count: number;
  family_head_status: string;
  status: string;
  status_reason?: string;
  health_info?: string;
  income_source?: string;
  expenses?: string;
  short_description?: string;
  notes?: string;
}


export const familyService = {
  getAll: () => api.get('/families'),
  getById: (id: string) => api.get(`/families/${id}`),
  create: (data: Family) => api.post('/families', data),
  update: (id: string, data: Partial<Family>) => api.put(`/families/${id}`, data),
  delete: (id: string) => api.delete(`/families/${id}`),
  addMember: (familyId: string, member: FamilyMember) => api.post(`/families/${familyId}/members`, member),
  updateMember: (familyId: string, memberId: string, member: Partial<FamilyMember>) => api.put(`/families/${familyId}/members/${memberId}`, member),
  deleteMember: (familyId: string, memberId: string) => api.delete(`/families/${familyId}/members/${memberId}`),
  addVisit: (familyId: string, visitDate: string, notes: string) => api.post(`/families/${familyId}/visits`, { visit_date: visitDate, notes }),
  addNeed: (familyId: string, need: FamilyNeed) => api.post(`/families/${familyId}/needs`, need),
  addAid: (familyId: string, aid: any) => api.post(`/families/${familyId}/aids`, aid),
  addSpiritualSupport: (data: any) => api.post('/families/spiritual-support', data),
  updateSpiritualSupport: (supportId: string, data: any) => api.put(`/families/spiritual-support/${supportId}`, data),
  // Ziyarət
updateVisit: (familyId: string, visitId: string, data: { visit_date: string; notes: string }) =>
  api.put(`/families/${familyId}/visits/${visitId}`, data),
deleteVisit: (familyId: string, visitId: string) =>
  api.delete(`/families/${familyId}/visits/${visitId}`),

// Ehtiyac (istər updateFamilyNeed, istər updateNeed)
updateNeed: (familyId: string, needId: string, data: any) =>
  api.put(`/families/${familyId}/needs/${needId}`, data),
deleteNeed: (familyId: string, needId: string) =>
  api.delete(`/families/${familyId}/needs/${needId}`),

// Yardım
updateAid: (familyId: string, aidId: string, data: any) =>
  api.put(`/families/${familyId}/aids/${aidId}`, data),
deleteAid: (familyId: string, aidId: string) =>
  api.delete(`/families/${familyId}/aids/${aidId}`),
};