import React from 'react';
import { Button } from '../components/ui/button';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const CTASection: React.FC = () => {
  return (
    <section className="py-20 bg-gray-400/10 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl overflow-hidden shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 md:p-12 flex items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
                    Ready to transform your data into business value?
                  </h2>
                  <p className="text-primary-100 text-lg mb-8">
                    Join thousands of companies using DataAnalyzer Pro to unlock insights and make better decisions every day.
                  </p>
                  
                  <ul className="space-y-3 mb-8">
                    {['No credit card required', 'Full access for 14 days', 'Cancel anytime'].map((item, index) => (
                      <li key={index} className="flex items-center">
                        <div className="bg-primary-700 rounded-full p-1 mr-3">
                          <Check className="h-4 w-4 text-primary-200" />
                        </div>
                        <span className="text-primary-100">{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <Link to="/dashboard">
                      <Button variant="accent" size="lg">
                        Start Your Free Trial
                      </Button>
                    </Link>
                    <Button variant="accent" size="lg">
                      Schedule a Demo
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="relative hidden lg:block">
                <img 
                  src="https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="DataAnalyzer Pro Dashboard Preview" 
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-primary-900/30"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection; 