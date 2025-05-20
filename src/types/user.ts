
export interface User {
  id: string;
  name: string;
  roles: string[];
  createdDate: string;
  lastLogin: string | null;
  status: 'active' | 'inactive' | 'pending';
  manager?: string | null;
  portal: 'kocharsoft' | 'igzy' | 'maxicus' | null;
}
