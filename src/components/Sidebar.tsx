
import React from 'react';
import { User } from '@/types/user';
import { Link } from 'react-router-dom';
import { Clock, Users } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  users: User[];
  currentPage?: string;
}

export const Sidebar = ({ isOpen, setIsOpen, users, currentPage = 'home' }: SidebarProps) => {
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <aside 
      className={`fixed top-0 left-0 h-full z-20 bg-teleport-gray transition-all duration-300 ease-in-out border-r border-slate-800 shadow-xl 
                 ${isOpen ? 'w-64' : 'w-16'}`}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        {isOpen && <span className="text-white font-bold">Teleport Admin</span>}
        <button 
          onClick={toggleSidebar} 
          className="text-white hover:text-gray-300 rounded-full p-2 hover:bg-slate-700"
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      <nav className="flex flex-col p-4">
        <Link 
          to="/" 
          className={`flex items-center space-x-2 p-2 rounded mb-2 hover:bg-slate-700 transition-colors
                       ${currentPage === 'home' ? 'bg-slate-700' : ''}`}
        >
          <Users size={20} className="text-white" />
          {isOpen && <span className="text-white">User Management</span>}
        </Link>
        
        <Link 
          to="/scheduler" 
          className={`flex items-center space-x-2 p-2 rounded mb-2 hover:bg-slate-700 transition-colors
                       ${currentPage === 'scheduler' ? 'bg-slate-700' : ''}`}
        >
          <Clock size={20} className="text-white" />
          {isOpen && <span className="text-white">Role Scheduler</span>}
        </Link>
      </nav>
    </aside>
  );
};
