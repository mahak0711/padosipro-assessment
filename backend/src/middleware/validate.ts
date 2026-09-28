import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fieldErrors = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'One or more fields are invalid', fields: fieldErrors },
      });
    }
    req.body = result.data;
    next();
  };
}
