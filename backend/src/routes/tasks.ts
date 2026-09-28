import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { taskSelectionSchema } from '../utils/validators';
import { ApiError } from '../middleware/errorHandler';

const router = Router();

function asyncHandler(fn: (...args: any[]) => Promise<any>) {
  return (req: any, res: any, next: any) => fn(req, res, next).catch(next);
}

router.get(
  '/',
  requireAuth,
  asyncHandler(async (_req: AuthedRequest, res) => {
    const tasks = await prisma.task.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
    res.json({ tasks });
  })
);

router.get(
  '/selected',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const selections = await prisma.userTask.findMany({
      where: { userId: req.userId },
      include: { task: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ tasks: selections.map((s) => s.task) });
  })
);

router.put(
  '/selected',
  requireAuth,
  validateBody(taskSelectionSchema),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { taskIds } = req.body as { taskIds: string[] };
    const uniqueIds = Array.from(new Set(taskIds));

    const existingTasks = await prisma.task.findMany({ where: { id: { in: uniqueIds } } });
    if (existingTasks.length !== uniqueIds.length) {
      throw new ApiError(422, 'INVALID_TASK_IDS', 'One or more selected tasks do not exist');
    }

    await prisma.$transaction([
      prisma.userTask.deleteMany({ where: { userId: req.userId } }),
      prisma.userTask.createMany({
        data: uniqueIds.map((taskId) => ({ userId: req.userId as string, taskId })),
      }),
    ]);

    const selections = await prisma.userTask.findMany({
      where: { userId: req.userId },
      include: { task: true },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ tasks: selections.map((s) => s.task) });
  })
);

export default router;
