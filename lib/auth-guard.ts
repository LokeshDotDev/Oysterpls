import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, JWTPayload } from './auth';
import { Role } from '@prisma/client';

export type AuthenticatedHandler = (
  req: NextRequest,
  session: JWTPayload,
  context: any
) => Promise<Response> | Response;

export function withAuth(
  handler: AuthenticatedHandler,
  allowedRoles?: Role[]
) {
  return async (req: NextRequest, context: any): Promise<Response> => {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient privileges' },
        { status: 403 }
      );
    }

    return handler(req, session, context);
  };
}
