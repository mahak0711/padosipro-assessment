import { api } from './client';

export interface Profile {
  email: string;
  name: string | null;
  mobileNumber: string | null;
  address: string | null;
  businessName: string | null;
  profileComplete: boolean;
}

export interface ProfileInput {
  name: string;
  mobileNumber: string;
  address: string;
  businessName?: string;
}

export const profileApi = {
  get: (token: string) => api.get<Profile>('/api/profile', token),
  update: (token: string, input: ProfileInput) => api.put<Profile>('/api/profile', input, token),
};
