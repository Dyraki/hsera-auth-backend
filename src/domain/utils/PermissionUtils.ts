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

  const num = Number(level) || 0;
  // Backward compatibility: Level 1..4 dari legacy database
  // 1: Read, 2: Create+Read, 3: Create+Read+Update, 4: Full CRUD
  if (num > 0 && num <= 4) {
    switch (num) {
      case 1: return action === 'read';
      case 2: return action === 'read' || action === 'create';
      case 3: return action === 'read' || action === 'create' || action === 'update';
      case 4: return true;
    }
  }

  const bits = String(Math.max(0, num)).padStart(4, '0');
  return bits[actionIndex[action]] === '1';
};
