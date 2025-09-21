import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  ChartBarIcon, 
  BellIcon, 
  CogIcon,
  EyeIcon,
  SignalIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
}

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/', 
    icon: HomeIcon, 
    description: 'Tổng quan thị trường'
  },
  { 
    name: 'Market Analysis', 
    href: '/market-analysis', 
    icon: ChartPieIcon, 
    description: 'Phân tích 6 kịch bản'
  },
  { 
    name: 'Trading Signals', 
    href: '/signals', 
    icon: SignalIcon, 
    description: 'Tín hiệu giao dịch'
  },
  { 
    name: 'Charts', 
    href: '/charts', 
    icon: ChartBarIcon, 
    description: 'Biểu đồ kỹ thuật'
  },
  { 
    name: 'Watchlist', 
    href: '/watchlist', 
    icon: EyeIcon, 
    description: 'Danh sách theo dõi'
  },
  { 
    name: 'Notifications', 
    href: '/notifications', 
    icon: BellIcon, 
    description: 'Cài đặt thông báo'
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: CogIcon, 
    description: 'Cài đặt hệ thống'
  },
];

export function Sidebar({ isOpen, onClose, isCollapsed = false }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 shadow-xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-gray-700">
            {!isCollapsed ? (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">VITAS</h1>
              </div>
            ) : (
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto">
                <ChartBarIcon className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center rounded-lg p-3 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30"
                      : "text-gray-300 hover:text-white hover:bg-gray-700/50",
                    isCollapsed && "justify-center px-3"
                  )
                }
                onClick={() => {
                  // Close mobile menu when navigating
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && (
                  <div className="ml-3 flex flex-col">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-gray-400">{item.description}</span>
                  </div>
                )}
              </NavLink>
            ))}
          </nav>
          
          {/* Live Status */}
          {!isCollapsed && (
            <div className="p-3 border-t border-gray-700">
              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-300">Live Market Data</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Real-time updates active</p>
              </div>
            </div>
          )}
          
          {/* Footer */}
          {!isCollapsed && (
            <div className="p-4 border-t border-gray-700">
              <div className="text-xs text-gray-400 text-center">
                <p className="font-medium text-gray-300">VITAS Trading System</p>
                <p>v2.0.0</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
