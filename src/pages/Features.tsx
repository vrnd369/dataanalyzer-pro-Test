import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  Zap, 
  LineChart, 
  PieChart, 
  FlaskConical, 
  FileQuestion, 
  Users, 
  Lock, 
  CloudCog 
} from 'lucide-react';
import FeatureCard from '../components/FeatureCard';

const Features: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const features = [
    {
      icon: <Zap size={24} className="text-accent-500" />,
      title: "AI Data Interpreter",
      description: "Our AI automatically interprets complex data patterns and presents findings in plain language anyone can understand."
    },
    {
      icon: <LineChart size={24} className="text-accent-500" />,
      title: "Predictive Analytics",
      description: "Forecast future trends with our predictive models that learn from your historical data."
    },
    {
      icon: <PieChart size={24} className="text-accent-500" />,
      title: "Visual Dashboard",
      description: "Create beautiful, interactive visualizations without writing a single line of code."
    },
    {
      icon: <FileQuestion size={24} className="text-accent-500" />,
      title: "Natural Language Queries",
      description: "Ask questions about your data in plain English and get instant answers."
    },
    {
      icon: <FlaskConical size={24} className="text-accent-500" />,
      title: "Automated Insights",
      description: "Receive automated insights about your data without having to hunt for them."
    },
    {
      icon: <Users size={24} className="text-accent-500" />,
      title: "Collaboration Tools",
      description: "Share insights with your team and collaborate on analysis in real-time."
    },
    {
      icon: <Lock size={24} className="text-accent-500" />,
      title: "Enterprise Security",
      description: "Bank-grade encryption and compliance with major security standards to keep your data safe."
    },
    {
      icon: <CloudCog size={24} className="text-accent-500" />,
      title: "Integration Ecosystem",
      description: "Connect with 200+ data sources and export to your favorite tools seamlessly."
    }
  ];

  return (
    <section 
      id="features" 
      className="py-20 bg-gray-400/10 relative overflow-hidden"
    >
      <div className="container mx-auto px-4 md:px-6">
        <motion.div 
          ref={sectionRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-16 relative"
        >
          {/* Decorative elements */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 0.1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute -top-20 -right-20 w-40 h-40 bg-gray-400 rounded-full blur-3xl"
          />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 0.1 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="absolute -bottom-20 -left-20 w-40 h-40 bg-gray-300 rounded-full blur-3xl"
          />
          
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-accent-500 font-semibold text-black tracking-wider uppercase text-sm"
          >
            Features
          </motion.span>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold text-black gradient-text mt-3 mb-6"
          >
            Everything You Need for Data-Driven Decisions
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl text-gray-600"
          >
            Our no-code platform gives you powerful tools that previously required a team of data scientists.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.6 + index * 0.1, type: 'spring' }}
                  viewport={{ once: true }}
                >
                  {feature.icon}
                </motion.div>
              }
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};


export default Features; 