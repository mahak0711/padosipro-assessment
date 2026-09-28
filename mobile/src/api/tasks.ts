import { api } from './client';

export interface Task {
  id: string;
  name: string;
  category: string;
  description: string;
}

export const tasksApi = {
  list: (token: string) => api.get<{ tasks: Task[] }>('/api/tasks', token),
  selected: (token: string) => api.get<{ tasks: Task[] }>('/api/tasks/selected', token),
  saveSelected: (token: string, taskIds: string[]) => api.put<{ tasks: Task[] }>('/api/tasks/selected', { taskIds }, token),
};
