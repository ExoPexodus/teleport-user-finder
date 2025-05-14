
export interface AdminUser {
  username: string;
  email: string;
  name: string;
  roles: string[];
  givenName: string | null;
  familyName: string | null;
}

export type UserRole = 'admin' | 'limited_user' | 'power_user' | string;

export function hasRole(user: AdminUser | null, requiredRole: UserRole): boolean {
  if (!user || !user.roles) return false;
  return user.roles.includes(requiredRole);
}

export function hasAnyRole(user: AdminUser | null, requiredRoles: UserRole[]): boolean {
  if (!user || !user.roles) return false;
  return requiredRoles.some(role => user.roles.includes(role));
}
