import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  GraduationCap
} from 'lucide-react';
import { cn } from '../lib/utils';

export const Layout: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['super_admin', 'sub_admin'] },
    { name: 'Admin Management', path: '/admin/users', icon: Users, roles: ['super_admin'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['super_admin', 'sub_admin'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    profile && item.roles.includes(profile.role)
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm flex items-center justify-between p-4 sticky top-0 z-20">
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-8 w-8 text-indigo-600" />
          <span className="font-bold text-xl text-gray-900">EduManage</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "bg-white w-full md:w-64 shadow-lg flex-col transition-all duration-300 ease-in-out z-10",
        "md:flex md:sticky md:top-0 md:h-screen",
        isMobileMenuOpen ? "flex fixed inset-y-0 left-0 mt-16 md:mt-0 h-[calc(100vh-4rem)]" : "hidden"
      )}>
        <div className="p-6 hidden md:flex items-center space-x-2 border-b border-gray-100">
          <GraduationCap className="h-8 w-8 text-indigo-600" />
          <span className="font-bold text-xl text-gray-900">EduManage</span>
        </div>

        <div className="p-4 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name}</p>
          <p className="text-xs text-gray-500 capitalize">{profile?.role.replace('_', ' ')}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path || 
                             (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-indigo-50 text-indigo-700" 
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-indigo-700" : "text-gray-400")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
