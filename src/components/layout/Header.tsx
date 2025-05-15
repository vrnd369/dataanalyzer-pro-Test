import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Hexagon, 
  Menu, 
  Bell, 
  User, 
  LogOut, 
  ChevronDown,
  Settings2
} from 'lucide-react';
import { SearchBarWithAutocomplete } from '../ui/SearchBarWithAutocomplete';
import { useSearch } from '@/contexts/SearchContext';
import { useAuth } from '@/hooks/useAuth';
import { AlertSystem } from '@/components/monitoring/AlertSystem';
import { SettingsPanel } from '@/components/settings/SettingsPanel';

interface HeaderProps {
  onMenuClick?: () => void;
}

const PublicHeader = () => (
  <header className="h-12 sm:h-14 md:h-16 glass-effect border-b border-white/20 relative z-50 bg-[#0A0B1A]">
    <div className="h-full w-full max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 flex items-center justify-between gap-4">
      <Link 
        to="/" 
        onClick={(e) => {
          if (window.location.pathname === "/") {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        className="flex items-center gap-1.5 sm:gap-2 md:gap-3 group"
      >
        <div className="relative">
          <div className="absolute inset-0 animate-pulse-glow bg-gradient-to-r from-teal-500/50 to-indigo-500/50 rounded-full blur-xl group-hover:opacity-100 transition-all duration-500"></div>
          <div className="relative transform transition-all duration-500 hover:scale-110 hover:rotate-180">
            <Hexagon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-teal-400" strokeWidth={1.5} />
            <Hexagon className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-teal-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-90" strokeWidth={1.5} />
          </div>
        </div>
        <span className="text-sm sm:text-base md:text-lg font-bold text-white whitespace-nowrap">DataAnalyzer Pro</span>
      </Link>
    </div>
  </header>
);

const AuthHeader = ({ onMenuClick }: HeaderProps) => {
  const navigate = useNavigate();
  const { state, search, selectResult } = useSearch();
  const { user, signOut } = useAuth();

  // State for UI elements
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleSearch = (query: string) => {
    search(query);
  };

  const handleResultSelect = (result: any) => {
    selectResult(result);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (window.location.pathname === "/dashboard") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header className="h-12 sm:h-14 md:h-16 glass-effect border-b border-white/20 relative z-50 bg-[#0A0B1A]">
      <div className="h-full w-full max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 flex items-center justify-between gap-4">
        <Link 
          to="/dashboard" 
          onClick={handleLogoClick}
          className="flex items-center gap-1.5 sm:gap-2 md:gap-3 group"
        >
          <div className="relative">
            <div className="absolute inset-0 animate-pulse-glow bg-gradient-to-r from-teal-500/50 to-indigo-500/50 rounded-full blur-xl group-hover:opacity-100 transition-all duration-500"></div>
            <div className="relative transform transition-all duration-500 hover:scale-110 hover:rotate-180">
              <Hexagon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-teal-400" strokeWidth={1.5} />
              <Hexagon className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-teal-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-90" strokeWidth={1.5} />
            </div>
          </div>
          <span className="text-sm sm:text-base md:text-lg font-bold text-white whitespace-nowrap">DataAnalyzer Pro</span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl relative hidden md:block">
          <SearchBarWithAutocomplete
            onSearch={handleSearch}
            onSelect={handleResultSelect}
            placeholder="Search..."
            className="w-full"
            results={state.results}
            isLoading={state.isLoading}
            showClearButton={true}
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <div className="relative">
            <AlertSystem
              data={{
                fields: [
                  {
                    name: "revenue",
                    type: "number",
                    value: [950000, 980000, 1020000, 1050000, 1100000],
                  },
                  {
                    name: "profit",
                    type: "number",
                    value: [95000, 98000, 102000, 105000, 110000],
                  },
                  {
                    name: "roi",
                    type: "number",
                    value: [12, 13, 14, 15, 16],
                  },
                ],
              }}
              thresholds={{
                revenue: 1200000,
                profit: 120000,
                roi: 18,
              }}
              isVisible={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
            <button 
              className="p-2 hover:bg-white/10 rounded-lg relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5 text-gray-300" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">3</span>
            </button>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              className="flex items-center gap-2 pl-2"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-500/30 to-indigo-500/30 flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
                <span className="text-sm font-medium text-teal-400">
                  {user?.email?.[0].toUpperCase() || "A"}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 glass-effect rounded-xl shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b border-white/10">
                  <p className="text-sm font-medium text-white">
                    {user?.email}
                  </p>
                </div>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate("/profile");
                  }}
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowSettings(true);
                  }}
                >
                  <Settings2 className="w-4 h-4" />
                  Settings
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/10 flex items-center gap-2"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isVisible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </header>
  );
};

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  return user ? <AuthHeader onMenuClick={onMenuClick} /> : <PublicHeader />;
}