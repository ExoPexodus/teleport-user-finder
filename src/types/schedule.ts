
export interface RoleChangeSchedule {
  id?: string;
  userId: string;
  userName: string;
  portal: string;
  scheduledTime: string;
  action: 'add' | 'remove';
  roles: string[];
  status?: string;
  executedAt?: string;
  result?: string;
}
