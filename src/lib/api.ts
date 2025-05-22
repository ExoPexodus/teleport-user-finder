import { User } from '@/types/user';
import { RoleChangeSchedule } from '@/types/schedule';
import { AITextResponse, AIAudioResponse } from '@/types/ai';

// API URL paths need to be adjusted to match nginx config
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

export async function login(username: string, password: string): Promise<{ token: string }> {
  const response = await fetch('/teleport/login', {
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
  localStorage.setItem('token', data.token);
  
  return data;
}

export async function fetchUsersFromSSH(client: string): Promise<{ success: boolean; message: string }> {
  // Get the token from localStorage
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Token is missing! Please login first.');
  }
  
  const response = await fetch('/teleport/fetch-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token, // Use the token in the headers as expected by the backend
    },
    body: JSON.stringify({ client }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch users from SSH');
  }
  
  return response.json();
}

// Function to schedule a role change
export async function scheduleRoleChange(schedule: RoleChangeSchedule): Promise<{ success: boolean; message: string }> {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Token is missing! Please login first.');
  }
  
  const response = await fetch('/teleport/schedule-role-change', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(schedule),
  });
  
  if (response.status === 403) {
    // Handle token expiration
    const errorData = await response.json();
    if (errorData.message?.includes('Token has expired')) {
      // Clear the invalid token
      localStorage.removeItem('token');
      throw new Error('Token has expired! Please login again.');
    }
    throw new Error(errorData.message || 'Authentication failed');
  }
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to schedule role change');
  }
  
  return response.json();
}

// Function to fetch all scheduled role changes
export async function fetchScheduledJobs(): Promise<RoleChangeSchedule[]> {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Token is missing! Please login first.');
  }
  
  const response = await fetch('/teleport/scheduled-jobs', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    }
  });
  
  if (response.status === 403) {
    // Handle token expiration
    const errorData = await response.json();
    if (errorData.message?.includes('Token has expired')) {
      // Clear the invalid token
      localStorage.removeItem('token');
      throw new Error('Token has expired! Please login again.');
    }
    throw new Error(errorData.message || 'Authentication failed');
  }
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch scheduled jobs');
  }
  
  return response.json();
}

// Function to execute a role change immediately
export async function executeRoleChange(userId: string, userName: string, portal: string, action: 'add' | 'remove', roles: string[]): Promise<{ success: boolean; message: string }> {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Token is missing! Please login first.');
  }
  
  const response = await fetch('/teleport/execute-role-change-immediate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify({
      userId,
      userName,
      portal,
      action,
      roles
    }),
  });
  
  if (response.status === 403) {
    // Handle token expiration
    const errorData = await response.json();
    if (errorData.message?.includes('Token has expired')) {
      // Clear the invalid token
      localStorage.removeItem('token');
      throw new Error('Token has expired! Please login again.');
    }
    throw new Error(errorData.message || 'Authentication failed');
  }
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to execute role change');
  }
  
  return response.json();
}

// Function to fetch available roles for a portal
export async function fetchAvailableRoles(portal: string): Promise<string[]> {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Token is missing! Please login first.');
  }
  
  const response = await fetch(`/teleport/available-roles?portal=${encodeURIComponent(portal)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    }
  });
  
  if (response.status === 403) {
    // Handle token expiration
    const errorData = await response.json();
    if (errorData.message?.includes('Token has expired')) {
      // Clear the invalid token
      localStorage.removeItem('token');
      throw new Error('Token has expired! Please login again.');
    }
    throw new Error(errorData.message || 'Authentication failed');
  }
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch available roles');
  }
  
  return response.json();
}

// AI API functions

export async function sendChatMessage(message: string): Promise<AITextResponse> {
  const formData = new FormData();
  formData.append('message', message);
  
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to get AI response');
  }
  
  return response.json();
}

export async function sendAudioMessage(audioFile: File): Promise<AIAudioResponse> {
  const formData = new FormData();
  formData.append('audio', audioFile);
  
  const response = await fetch('/api/ai/audio', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to process audio message');
  }
  
  return response.json();
}
