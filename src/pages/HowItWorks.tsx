import React from 'react';
import { motion, useInView } from 'framer-motion';
import { Upload, Sparkles, Presentation as PresentationChart, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';

const HowItWorks: React.FC = () => {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const steps = [
    {
      icon: <Upload className="h-12 w-12 text-white" />,
      title: "Connect Your Data",
      description: "Connect to your existing data sources or upload files in any format. DataAnalyzer Pro handles the integration automatically.",
      color: "bg-black",
      number: "01"
    },
    {
      icon: <Sparkles className="h-12 w-12 text-white" />,
      title: "AI Analysis",
      description: "Our AI engine automatically cleans, processes, and analyzes your data to uncover patterns and insights.",
      color: "bg-black",
      number: "02"
    },
    {
      icon: <PresentationChart className="h-12 w-12 text-white" />,
      title: "Get Actionable Insights",
      description: "View interactive dashboards, generate reports, and receive recommendations for business decisions.",
      color: "bg-black",
      number: "03"
    }
  ];

  return (
    <section 
      id="how-it-works" 
      className="py-20 section-gradient relative overflow-hidden"
      style={{
        '--gradient-start': 'rgb(242, 245, 255)',
        '--gradient-middle': 'rgb(255, 255, 255)',
        '--gradient-end': 'rgb(237, 242, 255)'
      } as React.CSSProperties}
      ref={sectionRef}
    >
      {/* Full-section background video */}
      {/* Overlay for better text contrast */}
      <div className="absolute inset-0 bg-white/10 z-10 pointer-events-none" />

      {/* Decorative background elements */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 0.1 } : {}}
        transition={{ duration: 1, delay: 0.2 }}
        className="absolute top-20 -right-20 w-80 h-80 bg-primary-400 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 0.1 } : {}}
        transition={{ duration: 1, delay: 0.4 }}
        className="absolute bottom-20 -left-20 w-80 h-80 bg-accent-400 rounded-full blur-3xl"
      />

      <div className="container mx-auto px-4 md:px-6 relative z-20">
        <motion.div 
          className="max-w-3xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <motion.span 
            className="text-accent-500 font-semibold tracking-wider uppercase text-sm inline-block"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Process
          </motion.span>
          <motion.h2 
            className="text-3xl md:text-4xl font-bold gradient-text mt-3 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            How DataAnalyzer Pro Works
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Get from raw data to actionable insights in just three simple steps.
            No coding or data science expertise required.
          </motion.p>
        </motion.div>

        <div className="relative mt-20">
          {/* Connection line */}
          <motion.div 
            className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-200 to-transparent -translate-y-1/2"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={isInView ? { scaleX: 1, opacity: 1 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {steps.map((step, index) => (
              <motion.div 
                key={index} 
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.2 }}
              >
                <div className="flex flex-col items-center">
                  {/* Step number */}
                  <motion.div 
                    className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-[120px] font-bold bg-gradient-to-br from-primary-200 to-primary-400 bg-clip-text text-transparent select-none"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={isInView ? { opacity: 0.2, scale: 1 } : {}}
                    transition={{ duration: 0.8, delay: 0.3 + index * 0.2 }}
                  >
                    {step.number}
                  </motion.div>
                  
                  {/* Icon circle */}
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 6 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`
                      relative z-10 flex items-center justify-center w-24 h-24 rounded-full 
                      ${step.color} shadow-lg mb-6 transform transition-all duration-500 
                      hover:shadow-2xl group
                      before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-tr 
                      before:from-white/20 before:to-transparent before:opacity-0 
                      before:transition-opacity before:duration-300 group-hover:before:opacity-100
                      after:absolute after:inset-0 after:rounded-full after:border-2 
                      after:border-white/20 after:scale-110 after:opacity-0 
                      after:transition-all after:duration-500 group-hover:after:scale-125 
                      group-hover:after:opacity-100
                    `}
                  >
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.8 }}
                    >
                      {step.icon}
                    </motion.div>
                  </motion.div>
                  
                  {/* Content */}
                  <div className="text-center group">
                    <h3 className="text-2xl font-bold text-primary-900 mb-3 relative inline-block">
                      <span className="relative z-10">{step.title}</span>
                      <span className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-r from-accent-200/40 via-accent-300/40 to-accent-200/40 -rotate-1 transform origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"></span>
                    </h3>
                    <p className="text-black transition-all duration-300 group-hover:text-gray-900">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Demo image */}
        <motion.div 
          className="mt-24 text-center relative"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-50/50 to-primary-100/50 -z-10"></div>
          <div className="bg-white p-6 rounded-2xl shadow-xl inline-block relative group hover:shadow-2xl transition-shadow duration-300">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/5 to-accent-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {/* Foreground image */}
            <img 
              src="/images/data-cover-web.jpg"
              alt="DataAnalyzer Pro Dashboard" 
              className="relative rounded-xl max-w-5xl w-full h-auto transform transition-transform duration-500 group-hover:scale-[1.02] z-10"
              style={{ maxHeight: "1200px" }} 
            />
          </div>
          <div className="mt-12 flex justify-center">
            <Button
              variant="default"
              size="lg"
              className="group"
              rightIcon={
                <ArrowRight className="ml-2 h-5 w-5 transform transition-transform duration-300 group-hover:translate-x-1" />
              }
            >
              Start Your Journey
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks; 