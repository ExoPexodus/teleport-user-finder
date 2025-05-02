
import { User } from '@/types/user';

// Using relative URL to make requests go through nginx proxy
const API_URL = '/api';

export async function fetchUsers(portal?: string): Promise<User[]> {
  const url = portal 
    ? `${API_URL}/users?portal=${encodeURIComponent(portal)}` 
    : `${API_URL}/users`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
}

export async function updateUser(user: User): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/users/${user.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update user');
  }
  
  return response.json();
}

export async function deleteUsers(userIds: string[]): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/users`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids: userIds }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete users');
  }
  
  return response.json();
}
