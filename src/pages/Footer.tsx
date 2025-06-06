import React from 'react';
import { Facebook, Twitter, Linkedin, Instagram, Mail, Hexagon } from 'lucide-react';
import BackgroundAnimation from '../components/ui/BackgroundAnimation';
import Bubbles from '../components/ui/Bubbles';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <BackgroundAnimation />
        <Bubbles />
      </div>
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse-glow bg-gradient-to-r from-teal-500/50 to-indigo-500/50 rounded-full blur-xl group-hover:opacity-100 transition-all duration-500"></div>
                  <div className="relative transform transition-all duration-500 hover:scale-110 hover:rotate-180">
                    <Hexagon className="w-8 h-8 text-teal-400" strokeWidth={1.5} />
                    <Hexagon className="w-6 h-6 text-teal-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-90" strokeWidth={1.5} />
                  </div>
                </div>
                <span className="ml-3 text-xl font-bold tracking-tight text-white">
                  DataAnalyzer Pro
                </span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Transform your business with AI-powered data analysis. No coding required.
                Get insights in minutes, not months.
              </p>
              <div className="flex space-x-4">
                <a href="https://www.facebook.com/share/1BUo6UK4fx/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-400 transition-colors">
                  <Facebook size={20} />
                </a>
                <a href="https://x.com/DataanalyzerPro?t=hp5H1qiPc9gQJSSH9et6_w&s=08" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-400 transition-colors">
                  <Twitter size={20} />
                </a>
                <a href="https://www.linkedin.com/company/dataanalyzerpro?fbclid=PAQ0xDSwKRw4hleHRuA2FlbQIxMQABpxwvl-1ybvpjcv0Tmq66qXIIvLu_JA7YSWxcZzcQLwgMT9J5NTbbsKhdBbDz_aem_1My3WpTwPa6a5YJdYcnZpA" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-400 transition-colors">
                  <Linkedin size={20} />
                </a>
                <a href="https://www.facebook.com/share/1BUo6UK4fx/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-400 transition-colors">
                  <Instagram size={20} />
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Product</h3>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Roadmap</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Case Studies</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Partners</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
              </ul>
              <div className="mt-6">
                <div className="flex items-center mb-2">
                  <Mail size={16} className="text-gray-400 mr-2" />
                  <a href="mailto:info@dataanalyzerpro.com" className="text-gray-400 hover:text-white transition-colors">
                    info@dataanalyzerpro.com
                  </a>
                </div>
                <div className="flex items-center">
                  <Mail size={16} className="text-gray-400 mr-2" />
                  <a href="mailto:support@dataanalyzerpro.com" className="text-gray-400 hover:text-white transition-colors">
                    support@dataanalyzerpro.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 text-sm">
                &copy; {currentYear} DataAnalyzer Pro, Inc. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-500 text-sm hover:text-white transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-500 text-sm hover:text-white transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-gray-500 text-sm hover:text-white transition-colors">
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 