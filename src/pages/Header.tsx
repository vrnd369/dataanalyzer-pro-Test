import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, Hexagon } from 'lucide-react';
import { Button } from '../components/ui/button';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const handleTryFree = () => navigate('/dashboard');

  return (
    <header className="fixed w-full z-50 bg-black py-4 shadow-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 pl-0 md:px-6 md:pl-0">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group ml-0">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse-glow bg-gradient-to-r from-teal-500/50 to-indigo-500/50 rounded-full blur-xl group-hover:opacity-100 transition-all duration-500"></div>
              <div className="relative transform transition-all duration-500 hover:scale-110 hover:rotate-180">
                <Hexagon className="w-8 h-8 text-teal-600" strokeWidth={1.5} />
                <Hexagon className="w-6 h-6 text-teal-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-90" strokeWidth={1.5} />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              DataAnalyzer Pro
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-white hover:text-teal-300 font-medium">Features</a>
            <a href="#how-it-works" className="text-white hover:text-teal-300 font-medium">How It Works</a>
            <a href="#pricing" className="text-white hover:text-teal-300 font-medium">Pricing</a>
            <a href="#testimonials" className="text-white hover:text-teal-300 font-medium">Testimonials</a>
          </nav>

          {/* Try Free Button - Desktop */}
          <div className="hidden md:flex items-center ">
             <Button
              className="bg-teal-600 text-white hover:bg-teal-700"
              size="icon"
              onClick={handleTryFree}
            >
              Try Free
            </Button>
          </div>
          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-white focus:outline-none"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-gray-700 animate-slide-down">
            <nav className="flex flex-col space-y-4">
              <a href="#features" className="text-white hover:text-teal-300 font-medium" onClick={toggleMenu}>Features</a>
              <a href="#how-it-works" className="text-white hover:text-teal-300 font-medium" onClick={toggleMenu}>How It Works</a>
              <a href="#pricing" className="text-white hover:text-teal-300 font-medium" onClick={toggleMenu}>Pricing</a>
              <a href="#testimonials" className="text-white hover:text-teal-300 font-medium" onClick={toggleMenu}>Testimonials</a>
            </nav>
            <div className="mt-4">
              <Button
                variant="default"
                size="sm"
                fullWidth
                onClick={() => {
                  setIsOpen(false);
                  handleTryFree();
                }}
              >
                Try Free
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 
