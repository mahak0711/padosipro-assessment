import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { profileSchema } from '../utils/validators';

const router = Router();

function asyncHandler(fn: (...args: any[]) => Promise<any>) {
  return (req: any, res: any, next: any) => fn(req, res, next).catch(next);
}

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }
    res.json({
      email: user.email,
      name: user.name,
      mobileNumber: user.mobileNumber,
      address: user.address,
      businessName: user.businessName,
      profileComplete: Boolean(user.name && user.mobileNumber && user.address),
    });
  })
);

router.put(
  '/',
  requireAuth,
  validateBody(profileSchema),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { name, mobileNumber, address, businessName } = req.body;
    const normalizedMobile = mobileNumber.startsWith('+91') ? mobileNumber : `+91${mobileNumber}`;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        name,
        mobileNumber: normalizedMobile,
        address,
        businessName: businessName || null,
        profileCompletedAt: new Date(),
      },
    });

    res.json({
      email: user.email,
      name: user.name,
      mobileNumber: user.mobileNumber,
      address: user.address,
      businessName: user.businessName,
      profileComplete: true,
    });
  })
);

export default router;
