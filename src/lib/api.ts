
import { User } from '@/types/user';

// Mock data to simulate Teleport API response
const mockUsers: User[] = [
  {
    id: '1',
    name: 'alice',
    roles: ['admin', 'developer'],
    createdDate: new Date('2023-01-15').toISOString(),
    lastLogin: new Date('2023-05-01T14:30:00').toISOString(),
    status: 'active'
  },
  {
    id: '2',
    name: 'bob',
    roles: ['developer'],
    createdDate: new Date('2023-02-20').toISOString(),
    lastLogin: new Date('2023-05-02T09:15:00').toISOString(),
    status: 'active'
  },
  {
    id: '3',
    name: 'charlie',
    roles: ['support', 'readonly'],
    createdDate: new Date('2023-03-05').toISOString(),
    lastLogin: new Date('2023-04-28T16:45:00').toISOString(),
    status: 'active'
  },
  {
    id: '4',
    name: 'dana',
    roles: ['developer', 'devops'],
    createdDate: new Date('2023-01-10').toISOString(),
    lastLogin: new Date('2023-04-30T11:20:00').toISOString(),
    status: 'active'
  },
  {
    id: '5',
    name: 'evan',
    roles: ['readonly'],
    createdDate: new Date('2023-04-12').toISOString(),
    lastLogin: null,
    status: 'pending'
  },
  {
    id: '6',
    name: 'fiona',
    roles: ['admin'],
    createdDate: new Date('2022-11-08').toISOString(),
    lastLogin: new Date('2023-05-01T08:45:00').toISOString(),
    status: 'active'
  },
  {
    id: '7',
    name: 'george',
    roles: ['developer', 'support'],
    createdDate: new Date('2023-02-15').toISOString(),
    lastLogin: new Date('2023-04-15T13:30:00').toISOString(),
    status: 'inactive'
  }
];

// Function to simulate API call to Teleport to get users
export const fetchUsers = async (): Promise<User[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate success (90% of the time)
  if (Math.random() > 0.1) {
    return mockUsers;
  }
  
  // Simulate failure (10% of the time)
  throw new Error('Failed to fetch users from Teleport API');
};
