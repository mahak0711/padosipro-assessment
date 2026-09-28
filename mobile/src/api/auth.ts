import { api } from './client';

export interface RegisterResponse {
  message: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: { id: string; email: string; profileComplete: boolean };
}

export const authApi = {
  register: (email: string, password: string) => api.post<RegisterResponse>('/api/auth/register', { email, password }),

  resendOtp: (email: string) => api.post<{ message: string }>('/api/auth/resend-otp', { email }),

  verifyOtp: (email: string, code: string) => api.post<{ message: string }>('/api/auth/verify-otp', { email, code }),

  login: (email: string, password: string) => api.post<LoginResponse>('/api/auth/login', { email, password }),
};
