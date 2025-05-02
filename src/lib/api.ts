
import { User } from '@/types/user';

// Base API URL
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5000/api';

// Function to fetch users from the backend
export const fetchUsers = async (portal?: string): Promise<User[]> => {
  try {
    const url = portal 
      ? `${API_URL}/users?portal=${encodeURIComponent(portal)}`
      : `${API_URL}/users`;
    
    console.log(`Fetching users from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Fetched users data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users from API');
  }
};

// Function to update a user
export const updateUser = async (user: User): Promise<void> => {
  try {
    const url = `${API_URL}/users/${encodeURIComponent(user.id)}`;
    console.log(`Updating user at: ${url}`, user);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('User update result:', result);
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user');
  }
};

// Keeping mock data commented for reference or fallback
/*
const mockUsers: User[] = [
  {
    id: '1',
    name: 'alice',
    roles: ['admin', 'developer'],
    createdDate: new Date('2023-01-15').toISOString(),
    lastLogin: new Date('2023-05-01T14:30:00').toISOString(),
    status: 'active',
    manager: 'david',
    portal: 'kocharsoft'
  },
  {
    id: '2',
    name: 'bob',
    roles: ['developer'],
    createdDate: new Date('2023-02-20').toISOString(),
    lastLogin: new Date('2023-05-02T09:15:00').toISOString(),
    status: 'active',
    manager: 'fiona',
    portal: 'igzy'
  },
  {
    id: '3',
    name: 'charlie',
    roles: ['support', 'readonly'],
    createdDate: new Date('2023-03-05').toISOString(),
    lastLogin: new Date('2023-04-28T16:45:00').toISOString(),
    status: 'active',
    manager: 'david',
    portal: 'maxicus'
  },
  {
    id: '4',
    name: 'dana',
    roles: ['developer', 'devops'],
    createdDate: new Date('2023-01-10').toISOString(),
    lastLogin: new Date('2023-04-30T11:20:00').toISOString(),
    status: 'active',
    manager: 'fiona',
    portal: 'kocharsoft'
  },
  {
    id: '5',
    name: 'evan',
    roles: ['readonly'],
    createdDate: new Date('2023-04-12').toISOString(),
    lastLogin: null,
    status: 'pending',
    manager: null,
    portal: 'igzy'
  },
  {
    id: '6',
    name: 'fiona',
    roles: ['admin'],
    createdDate: new Date('2022-11-08').toISOString(),
    lastLogin: new Date('2023-05-01T08:45:00').toISOString(),
    status: 'active',
    manager: null,
    portal: 'maxicus'
  },
  {
    id: '7',
    name: 'george',
    roles: ['developer', 'support'],
    createdDate: new Date('2023-02-15').toISOString(),
    lastLogin: new Date('2023-04-15T13:30:00').toISOString(),
    status: 'inactive',
    manager: 'david',
    portal: 'kocharsoft'
  }
];
*/
