import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, Hexagon, ArrowRight, Sparkles, Shield, BarChart, Share2, Award, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import Spline from '@splinetool/react-spline';

const trustBadges = [
  { icon: <Sparkles size={16} color="black" stroke="black" style={{ color: 'black', stroke: 'black', fill: 'black' }} />, text: "AI-Powered Analytics" },
  { icon: <Shield size={16} color="black" stroke="black" style={{ color: 'black', stroke: 'black', fill: 'black' }} />, text: "Enterprise Security" },
  { icon: <BarChart size={16} color="black" stroke="black" style={{ color: 'black', stroke: 'black', fill: 'black' }} />, text: "No-Code Platform" },
  { icon: <Award size={16} color="black" stroke="black" style={{ color: 'black', stroke: 'black', fill: 'black' }} />, text: "Industry Leader" },
  { icon: <Zap size={16} color="black" stroke="black" style={{ color: 'black', stroke: 'black', fill: 'black' }} />, text: "Real-time Insights" }
];

const slides = [
  {
    id: 1,
    title: "Turn Data Into Decisions",
    subtitle: "Without Code 🚀",
    description: "Smarter insights. Zero delay. Perfect for high-performing teams."
  },
  {
    id: 2,
    title: "AI-Powered Analytics",
    subtitle: "Made Simple ✨",
    description: "Just upload your data and let AI do the magic."
  },
  {
    id: 3,
    title: "Share Your Insights",
    subtitle: "Go Viral 🔥",
    description: "Create stunning visuals that get attention."
  }
];

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const statsRef = React.useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsOpen(!isOpen);
  const handleTryFree = () => navigate('/dashboard');

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header className="w-full z-50 bg-black py-4 shadow-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse-glow bg-gradient-to-r from-teal-500/50 to-indigo-500/50 rounded-full blur-xl group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative transform transition-all duration-500 hover:scale-110 hover:rotate-180">
                  <Hexagon className="w-8 h-8 text-teal-400" strokeWidth={1.5} />
                  <Hexagon className="w-6 h-6 text-teal-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-90" strokeWidth={1.5} />
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                DataAnalyzer Pro
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-white hover:text-teal-300 font-semibold">Features</a>
              <a href="#how-it-works" className="text-white hover:text-teal-300 font-semibold">How It Works</a>
              <a href="#pricing" className="text-white hover:text-teal-300 font-semibold">Pricing</a>
              <a href="#testimonials" className="text-white hover:text-teal-300 font-semibold">Testimonials</a>
            </nav>

            {/* Try Free Button - Desktop */}
            <div className="hidden md:flex items-center">
              <button
                className="bg-white text-black font-semibold rounded-md px-6 py-2 hover:bg-gray-200 transition"
                onClick={handleTryFree}
              >
                Try Free
              </button>
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
                <a href="#features" className="text-white hover:text-teal-300 font-semibold" onClick={toggleMenu}>Features</a>
                <a href="#how-it-works" className="text-white hover:text-teal-300 font-semibold" onClick={toggleMenu}>How It Works</a>
                <a href="#pricing" className="text-white hover:text-teal-300 font-semibold" onClick={toggleMenu}>Pricing</a>
                <a href="#testimonials" className="text-white hover:text-teal-300 font-semibold" onClick={toggleMenu}>Testimonials</a>
              </nav>
              <div className="mt-4">
                <button
                  className="w-full bg-white text-black font-semibold rounded-md px-6 py-2 hover:bg-gray-200 transition"
                  onClick={() => {
                    setIsOpen(false);
                    handleTryFree();
                  }}
                >
                  Try Free
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 md:pt-32">
        {/* Spline 3D Scene */}
        <div className="absolute inset-0 w-full h-full z-0">
          <Spline scene="https://prod.spline.design/ZEeGookO-CwCceAi/scene.splinecode" />
        </div>
        
        {/* Background gradient - adjusted opacity to work with Spline */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200/10 via-gray-300/10 to-gray-400/10 animate-gradient-shift z-1"></div>
        
        {/* Decorative elements - adjusted opacity to work with Spline */}
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-gray-300/20 rounded-full filter blur-3xl z-1 animate-float"></div>
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-gray-200 rounded-full filter blur-3xl opacity-10 z-1 animate-float" style={{ animationDelay: '1s' }}></div>
        
        {/* Content container */}
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-5xl mx-auto relative">
            
            {/* Trust badges marquee loop */}
            <div className="relative overflow-hidden mb-6">
              <div className="flex w-max animate-marquee whitespace-nowrap gap-4 pr-4">
                {[...trustBadges, ...trustBadges].map((badge, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center px-4 py-2 bg-white/10 backdrop-blur rounded-full shadow-sm"
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className="text-black mr-2">{badge.icon}</span>
                    <span className="text-sm font-semibold text-black whitespace-nowrap">
                      {badge.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative h-[200px] mb-8">
                {slides.map((slide, index) => (
                  <motion.div
                    key={slide.id}
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: index === currentSlide ? 1 : 0,
                      y: index === currentSlide ? 0 : 20
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-black">
                      {slide.title}
                    </h1>
                    <p className="text-3xl md:text-4xl lg:text-5xl font-bold mt-4 text-black">
                      {slide.subtitle}
                    </p>
                  </motion.div>
                ))}
              </div>
              
              <motion.p 
                className="text-xl md:text-2xl text-black max-w-2xl mx-auto mb-8 leading-relaxed"
                key={currentSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {slides[currentSlide].description}
              </motion.p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-6 mb-12">
                <Link to="/dashboard">
                  <Button 
                    variant="default" 
                    size="lg"
                    className="relative overflow-hidden bg-white text-black group"
                    rightIcon={<ArrowRight className="ml-2 h-5 w-5" />}
                    onClick={handleTryFree}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-black to-gray opacity-25 group-hover:opacity-100 transition-opacity duration-300"
                      whileHover={{ scale: 1.1 }}
                    />
                    Try it Now
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 relative overflow-hidden group text-black border-black"
                  leftIcon={<Share2 className="mr-2 h-5 w-5" />}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-black to-gray opacity-25 group-hover:opacity-100 transition-opacity duration-300"
                    whileHover={{ scale: 1.1 }}
                  />
                  Share with Friends
                </Button>
              </div>
              
              {/* Stats banner */}
              <motion.div 
                ref={statsRef} 
                className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6 }}
              >
                {/* Add your stats content here */}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Header; 