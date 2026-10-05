export type PermissionAction = 'read' | 'create' | 'update' | 'delete';

const actionIndex: Record<PermissionAction, number> = {
  create: 0,
  read: 1,
  update: 2,
  delete: 3,
};

export const permissionLevelToAction = (minLevel: number): PermissionAction | null => {
  switch (minLevel) {
    case 1: return 'read';
    case 2: return 'create';
    case 3: return 'update';
    case 4: return 'delete';
    default: return null;
  }
};

export const hasPermissionAction = (level: number, minLevel: number): boolean => {
  const action = permissionLevelToAction(minLevel);
  if (!action) return false;
  const bits = String(Math.max(0, Number(level) || 0)).padStart(4, '0');
  return bits[actionIndex[action] as number] === '1';
};
