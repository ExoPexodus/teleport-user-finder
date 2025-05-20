
import { User } from '@/types/user';
import { RoleChangeSchedule } from '@/types/schedule';
import { AdminUser } from '@/types/admin';

// Using relative URL to make requests go through nginx proxy
const API_URL = '/api';

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (response.status === 401 || response.status === 403) {
    // Authentication error
    localStorage.removeItem('token');
    localStorage.removeItem('user_roles');
    window.location.href = '/login'; // Force redirect to login
    const errorData = await response.json().catch(() => ({ message: 'Authentication failed' }));
    throw new Error(errorData.message || 'Authentication failed. Please login again.');
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(errorData.message || `Request failed with status: ${response.status}`);
  }
  
  return response.json();
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export async function fetchUsers(portal?: string): Promise<User[]> {
  const url = portal 
    ? `${API_URL}/users?portal=${encodeURIComponent(portal)}` 
    : `${API_URL}/users`;
  
  const response = await fetch(url, {
    headers: {
      ...getAuthHeaders()
    }
  });
  
  return handleResponse(response);
}

export async function updateUser(user: User): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/users/${user.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(user),
  });
  
  return handleResponse(response);
}

export async function deleteUsers(userIds: string[]): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/users`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ ids: userIds }),
  });
  
  return handleResponse(response);
}

export async function login(username: string, password: string): Promise<{ token: string }> {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Login failed');
  }
  
  const data = await response.json();
  // Store the token in localStorage for future requests
  localStorage.setItem('token', data.access_token || data.token);
  
  // Store user roles in localStorage if present in the decoded token
  if (data.decoded_token && data.decoded_token.realm_access && data.decoded_token.realm_access.roles) {
    localStorage.setItem('user_roles', JSON.stringify(data.decoded_token.realm_access.roles));
  }
  
  return data;
}

export async function fetchUserProfile(): Promise<AdminUser> {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch('/auth/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return handleResponse(response);
}

export async function fetchUsersFromSSH(client: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/teleport/fetch-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ client }),
  });
  
  return handleResponse(response);
}

// Function to schedule a role change
export async function scheduleRoleChange(schedule: RoleChangeSchedule): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/teleport/schedule-role-change', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(schedule),
  });
  
  return handleResponse(response);
}

// Function to fetch all scheduled role changes
export async function fetchScheduledJobs(): Promise<RoleChangeSchedule[]> {
  const response = await fetch('/teleport/scheduled-jobs', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    }
  });
  
  return handleResponse(response);
}

// Function to execute a role change immediately
export async function executeRoleChange(userId: string, userName: string, portal: string, action: 'add' | 'remove', roles: string[]): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/teleport/execute-role-change-immediate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      userId,
      userName,
      portal,
      action,
      roles
    }),
  });
  
  return handleResponse(response);
}

// Function to fetch available roles for a portal
export async function fetchAvailableRoles(portal: string): Promise<string[]> {
  const response = await fetch(`/teleport/available-roles?portal=${encodeURIComponent(portal)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    }
  });
  
  return handleResponse(response);
}
