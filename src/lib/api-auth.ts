
import { AdminUser } from '@/types/admin';

// Fetch the current user's profile from the backend
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
  
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      throw new Error('Authentication expired. Please login again.');
    }
    throw new Error('Failed to fetch user profile');
  }
  
  return await response.json();
}

// Check if the current user has a specific role
export async function checkUserHasRole(role: string): Promise<boolean> {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return false;
  }
  
  try {
    const profile = await fetchUserProfile();
    return profile.roles.includes(role);
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}

// Check if the current user has admin access
export async function checkIsAdmin(): Promise<boolean> {
  return checkUserHasRole('admin');
}

// Check if the current user has limited user access
export async function checkIsLimitedUser(): Promise<boolean> {
  return checkUserHasRole('limited_user');
}

// Logout the user
export function logout(): void {
  localStorage.removeItem('token');
  // Redirect to login page or home page as needed
  window.location.href = '/';
}
