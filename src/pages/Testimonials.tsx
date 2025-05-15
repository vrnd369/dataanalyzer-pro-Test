import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface Testimonial {
  quote: string;
  author: string;
  position: string;
  company: string;
  avatar: string;
  stars: number;
}

const Testimonials: React.FC = () => {
  const testimonials: Testimonial[] = [
    {
      quote: "DataAnalyzer Pro transformed how we utilize our data. We've increased our marketing ROI by 43% in just 3 months by identifying underperforming channels and optimizing our budget allocation.",
      author: "Sarah Johnson",
      position: "CMO",
      company: "Quantum Retail",
      avatar: "https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      stars: 5
    },
    {
      quote: "As a financial analyst, I was skeptical about a no-code solution, but DataAnalyzer Pro exceeded my expectations. The predictive models are as accurate as our custom-built ones, but take minutes to create instead of weeks.",
      author: "Michael Chen",
      position: "Senior Financial Analyst",
      company: "Global Finance Partners",
      avatar: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      stars: 5
    },
    {
      quote: "The natural language query feature is a game-changer. Our executives can now get answers to complex data questions in seconds without having to wait for the analytics team to build reports.",
      author: "Jennifer Lopez",
      position: "Director of Operations",
      company: "TechStream Inc.",
      avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      stars: 5
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  const renderStars = (count: number) => {
    return Array(count)
      .fill(0)
      .map((_, i) => (
        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
      ));
  };

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-b from-gray-50 to-white" style={{ color: 'black' }}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-accent-500 font-semibold tracking-wider uppercase text-sm">Testimonials</span>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mt-3 mb-6">
            Trusted by Industry Leaders
          </h2>
          <p className="text-xl text-gray-600">
            See how companies are using DataAnalyzer Pro to transform their data analytics capabilities.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative bg-white rounded-2xl shadow-xl p-8 md:p-12">
            {/* Decorative quotes */}
            <div className="absolute top-6 left-8 text-8xl text-primary-100">"</div>
            <div className="absolute bottom-6 right-8 text-8xl text-primary-100">"</div>
            
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                {renderStars(testimonials[currentIndex].stars)}
              </div>
              
              <blockquote className="text-xl md:text-2xl text-center text-gray-700 italic mb-10">
                "{testimonials[currentIndex].quote}"
              </blockquote>
              
              <div className="flex flex-col items-center">
                <img 
                  src={testimonials[currentIndex].avatar} 
                  alt={testimonials[currentIndex].author} 
                  className="w-16 h-16 rounded-full object-cover mb-4"
                />
                <div className="text-center">
                  <h4 className="font-bold text-lg text-primary-900">
                    {testimonials[currentIndex].author}
                  </h4>
                  <p className="text-gray-600">
                    {testimonials[currentIndex].position}, {testimonials[currentIndex].company}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Navigation buttons */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-4">
              <button 
                onClick={prevTestimonial}
                className="bg-white rounded-full p-2 shadow-md hover:bg-primary-50 transition-colors"
              >
                <ChevronLeft className="h-6 w-6 text-primary-600" />
              </button>
              <button 
                onClick={nextTestimonial}
                className="bg-white rounded-full p-2 shadow-md hover:bg-primary-50 transition-colors"
              >
                <ChevronRight className="h-6 w-6 text-primary-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 