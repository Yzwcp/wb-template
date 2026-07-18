import { JwtPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & {
        permissions?: string[];
        roles?: string[];
      };
      requestId?: string;
      traceId?: string;
    }
  }
}

export {};
