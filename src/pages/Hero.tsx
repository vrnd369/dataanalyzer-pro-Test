import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { ArrowRight, Sparkles, Shield, BarChart, Share2, Award, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const trustBadges = [
  { icon: <Sparkles size={16} color="black" stroke="black" style={{ color: 'black', stroke: 'black', fill: 'black' }} />, text: "AI-Powered Analytics" },
  { icon: <Shield size={16} color="black" stroke="black" style={{ color: 'black', stroke: 'black', fill: 'black' }} />, text: "Enterprise Security" },
  { icon: <BarChart size={16} color="black" stroke="black" style={{ color: 'black', stroke: 'black', fill: 'black' }} />, text: "No-Code Platform" },
  { icon: <Award size={16} color="black" stroke="black" style={{ color: 'black', stroke: 'black', fill: 'black' }} />, text: "Industry Leader" },
  { icon: <Zap size={16} color="black" stroke="black" style={{ color: 'black', stroke: 'black', fill: 'black' }} />, text: "Real-time Insights" }
];

const Hero: React.FC = () => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const statsRef = React.useRef<HTMLDivElement>(null);
  
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 md:pt-32">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-200/20 via-gray-300/20 to-gray-400/20 animate-gradient-shift -z-10"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-gray-300/30 rounded-full filter blur-3xl -z-10 animate-float"></div>
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-gray-200 rounded-full filter blur-3xl opacity-20 -z-10 animate-float" style={{ animationDelay: '1s' }}></div>
      
      <div className="container mx-auto px-4 md:px-6">
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
                  className="absolute inset-0 bg-gradient-to-r from-black to-gray opacity-25 group-hover:opacity-100 transition-opacity duration-300
"
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
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-md p-6 animated-border">
                <p className="text-4xl font-bold text-black mb-2">
                  97%
                </p>
                <p className="text-black">Faster insights than traditional methods</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-md p-6 animated-border">
                <p className="text-4xl font-bold text-black mb-2">
                  10,000+
                </p>
                <p className="text-black">Business decisions powered monthly</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-md p-6 animated-border">
                <p className="text-4xl font-bold text-black mb-2">
                  $2.3M
                </p>
                <p className="text-black">Average savings per enterprise customer</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 
