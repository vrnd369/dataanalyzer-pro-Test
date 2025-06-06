import React from 'react';
import { motion, useInView } from 'framer-motion';
import { Briefcase, TrendingUp, PieChartIcon as ChartPieIcon, ShoppingBag, GraduationCap, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';

const AudienceCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  useCases: string[];
  index: number;
}> = ({ icon, title, description, useCases, index }) => {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const isCardInView = useInView(cardRef, { once: true, margin: "-100px" });
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isCardInView ? 1 : 0,
        y: isCardInView ? 0 : 20,
        transition: { duration: 0.6, delay: index * 0.1 }
      }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white rounded-xl p-8 relative group"
    >
      {/* Gradient border effect with new colors */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#233B77] via-[#3DB7E4] to-[#233B77] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur"></div>
      
      {/* White background */}
      <div className="absolute inset-[1px] rounded-xl bg-white"></div>
      
      <div className="relative">
      <div className="bg-[#F6F8FA] rounded-full w-14 h-14 flex items-center justify-center mb-6">
        <motion.div
          animate={{
            rotate: isHovered ? 360 : 0,
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ duration: 0.6 }}
        >
          {icon}
        </motion.div>
      </div>
      <motion.h3 
        animate={{ y: isHovered ? -2 : 0 }}
        className="text-xl font-bold text-[#1A1A1A] mb-3"
      >
        {title}
      </motion.h3>
      <motion.p 
        animate={{ opacity: isHovered ? 0.9 : 0.7 }}
        className="text-gray-600 mb-6"
      >
        {description}
      </motion.p>
      <motion.ul 
        className="space-y-2 mb-6"
        animate={{ x: isHovered ? 4 : 0 }}
      >
        {useCases.map((useCase, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ 
              opacity: isCardInView ? 1 : 0,
              x: isCardInView ? 0 : -10
            }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="flex items-start"
          >
            <svg className="h-5 w-5 text-[#4CAF50] mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700">{useCase}</span>
          </motion.li>
        ))}
      </motion.ul>
      <Button 
        variant="outline" 
        size="sm"
        className="relative overflow-hidden group"
      >
        <motion.div
          className="absolute inset-0 bg-[#F6F8FA] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          whileHover={{ scale: 1.1 }}
        />
        <span className="relative z-10">
        Learn More
        </span>
      </Button>
      </div>
    </motion.div>
  );
};

const Audiences: React.FC = () => {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const audiences = [
    {
      icon: <Briefcase className="h-6 w-6 text-[#233B77]" />,
      title: "Business Executives",
      description: "Make data-driven decisions without relying on technical teams.",
      useCases: [
        "KPI dashboards",
        "Performance forecasting",
        "Competitive analysis"
      ]
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-[#233B77]" />,
      title: "Marketing Teams",
      description: "Uncover insights to optimize campaigns and increase ROI.",
      useCases: [
        "Campaign analytics",
        "Customer segmentation",
        "Attribution modeling"
      ]
    },
    {
      icon: <ChartPieIcon className="h-6 w-6 text-[#233B77]" />,
      title: "Financial Analysts",
      description: "Simplify financial modeling and scenario planning.",
      useCases: [
        "Financial forecasting",
        "Risk assessment",
        "Anomaly detection"
      ]
    },
    {
      icon: <ShoppingBag className="h-6 w-6 text-[#233B77]" />,
      title: "Sales Teams",
      description: "Identify opportunities and optimize the sales pipeline.",
      useCases: [
        "Lead scoring",
        "Sales forecasting",
        "Territory optimization"
      ]
    },
    {
      icon: <GraduationCap className="h-6 w-6 text-[#233B77]" />,
      title: "Research Teams",
      description: "Accelerate research with automated data processing.",
      useCases: [
        "Data exploration",
        "Hypothesis testing",
        "Trend analysis"
      ]
    },
    {
      icon: <Heart className="h-6 w-6 text-[#233B77]" />,
      title: "Healthcare Providers",
      description: "Improve patient outcomes with data-driven insights.",
      useCases: [
        "Patient risk assessment",
        "Treatment optimization",
        "Resource allocation"
      ]
    }
  ];

  return (
    <section 
      className="py-20 bg-gray-400/10 relative overflow-hidden section-gradient"
      ref={sectionRef}
      style={{
        '--gradient-start': '#F6F8FA',
        '--gradient-middle': 'rgb(255, 255, 255)',
        '--gradient-end': '#F6F8FA'
      } as React.CSSProperties}
    >
      {/* Decorative background elements */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 0.1 } : {}}
        transition={{ duration: 1, delay: 0.2 }}
        className="absolute top-20 -right-20 w-80 h-80 bg-[#233B77] rounded-full blur-3xl"
      />
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 0.1 } : {}}
        transition={{ duration: 1, delay: 0.4 }}
        className="absolute bottom-20 -left-20 w-80 h-80 bg-[#3DB7E4] rounded-full blur-3xl"
      />

      <div className="container mx-auto px-4 md:px-6">
        <motion.div 
          className="max-w-3xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-accent-500 font-semibold tracking-wider uppercase text-sm">Who It's For</span>
          <h2 className="text-3xl md:text-4xl font-bold gradient-text mt-3 mb-6">
            Built for Every Team
          </h2>
          <p className="text-xl text-gray-600">
            DataAnalyzer Pro empowers professionals across all industries to leverage the power of data analytics,
            regardless of technical background.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {audiences.map((audience, index) => (
            <AudienceCard
              key={index}
              icon={audience.icon}
              title={audience.title}
              description={audience.description}
              useCases={audience.useCases}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Audiences; 