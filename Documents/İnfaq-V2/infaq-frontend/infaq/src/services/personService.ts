import api from './api';

export interface Person {
  _id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'admin' | 'backend_responsible' | 'volunteer' | 'master';
  is_active: boolean;
  profile_image?: string;
}

export const personService = {
  getAll: (role?: string) => {
    const url = role ? `/persons?role=${role}` : '/persons';
    return api.get<Person[]>(url);
  },
  getById: (id: string) => api.get<Person>(`/persons/${id}`),
  create: (data: Partial<Person> & { password: string }) => api.post('/persons', data),
  update: (id: string, data: Partial<Person>) => api.put(`/persons/${id}`, data),
  delete: (id: string) => api.delete(`/persons/${id}`),
};