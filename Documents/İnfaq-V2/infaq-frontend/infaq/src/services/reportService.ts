import api from './api';

export interface Report {
  _id?: string;
  report_month: string;
  actual_income: number;
  forecast_income: number;
  actual_expense: number;
  forecast_expense: number;
  status: string;
  end_of_month_budget: number;
  notes?: string;
  related_files?: string[];
}

export const reportService = {
  getAll: (year?: number, month?: number) => {
    let url = '/reports';
    if (year && month) url += `?year=${year}&month=${month}`;
    return api.get(url);
  },
  getById: (id: string) => api.get(`/reports/${id}`),
  create: (data: any) => api.post('/reports', data),
  update: (id: string, data: Partial<Report>) => api.put(`/reports/${id}`, data),
  approve: (id: string) => api.put(`/reports/${id}/approve`),
  delete: (id: string) => api.delete(`/reports/${id}`),
};