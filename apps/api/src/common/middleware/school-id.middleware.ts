import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SchoolIdMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if ((req as any).user?.schoolId) {
      (req as any).schoolId = (req as any).user.schoolId;
    }
    next();
  }
}
