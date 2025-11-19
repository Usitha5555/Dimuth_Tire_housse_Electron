import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: 'Products', 
      href: '/products', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    { 
      name: 'Billing', 
      href: '/billing', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      name: 'Invoices', 
      href: '/invoices', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 border-r border-gray-800 text-white transition-all duration-300 flex flex-col shadow-2xl`}
      >
        {/* Logo/Brand Section */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'} transition-opacity duration-300`}>
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                <span className="text-gray-900 font-bold text-lg">DT</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-white">
                  Dimuth Tirehouse
                </h1>
                <p className="text-xs text-gray-400">Management System</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200 flex-shrink-0 text-gray-400 hover:text-white"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 px-4 py-6 space-y-1 overflow-y-auto ${sidebarOpen ? '' : 'overflow-hidden'} scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900`}>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group relative flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <div className={`flex-shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-white'}`}>
                  {item.icon}
                </div>
                
                <span className={`ml-3 font-medium text-sm transition-all duration-300 ${
                  sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute'
                }`}>
                  {item.name}
                </span>
                
                {/* Tooltip for collapsed state */}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-gray-700">
                    {item.name}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <div className={`${sidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-gray-900 font-semibold text-xs">DT</span>
              </div>
              <div>
                <p className="font-semibold text-xs text-white">Dimuth Tirehouse</p>
                <p className="text-xs text-gray-400">v1.0.0</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
              <span>System Online</span>
            </div>
          </div>
          
          {/* Collapsed footer */}
          {!sidebarOpen && (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-gray-900 font-semibold text-xs">DT</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">
              {navigation.find((item) => item.href === location.pathname)?.name ||
                'Dimuth Tirehouse'}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
