import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import taskRoutes from './routes/tasks';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/tasks', taskRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
