import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const pageConfig = {
  '/': { 
    title: 'Dashboard', 
    subtitle: 'Tổng quan thị trường và tín hiệu giao dịch' 
  },
  '/market-analysis': { 
    title: 'Market Analysis', 
    subtitle: 'Phân tích 6 kịch bản thị trường' 
  },
  '/signals': { 
    title: 'Trading Signals', 
    subtitle: 'Tín hiệu mua bán và cảnh báo rủi ro' 
  },
  '/charts': { 
    title: 'Charts', 
    subtitle: 'Biểu đồ kỹ thuật và phân tích' 
  },
  '/watchlist': { 
    title: 'Watchlist', 
    subtitle: 'Danh sách mã cổ phiếu theo dõi' 
  },
  '/notifications': { 
    title: 'Notifications', 
    subtitle: 'Cài đặt thông báo' 
  },
  '/settings': { 
    title: 'Settings', 
    subtitle: 'Cài đặt hệ thống' 
  },
};

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Get current page config
  const currentPage = pageConfig[location.pathname as keyof typeof pageConfig] || {
    title: 'VITAS Trading',
    subtitle: 'Hệ thống phân tích và giao dịch'
  };

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isCollapsed={sidebarCollapsed}
          title={currentPage.title}
          subtitle={currentPage.subtitle}
        />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-4 py-6 lg:px-6 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
