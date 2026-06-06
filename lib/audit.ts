import prisma from './db';

interface AuditLogOptions {
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
}

export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  oldValue,
  newValue,
  ipAddress,
}: AuditLogOptions) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}
