import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';

interface PricingPlan {
  name: string;
  price: {
    monthly: string;
    annual: string;
  };
  description: string;
  features: {
    included: string[];
    excluded: string[];
  };
  buttonText: string;
  isPopular?: boolean;
}

const Pricing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans: PricingPlan[] = [
    {
      name: "Starter",
      price: {
        monthly: "$49",
        annual: "$39",
      },
      description: "Perfect for individuals and small teams just getting started with data analysis.",
      features: {
        included: [
          "Up to 5 data sources",
          "5 GB data storage",
          "Basic AI analysis",
          "Standard visualizations",
          "Email support",
          "Advanced AI models"
        ],
        excluded: [
          "Custom branding",
          "API access",
          "Team collaboration",
          "Priority support"
        ]
      },
      buttonText: "Get Started"
    },
    {
      name: "Professional",
      price: {
        monthly: "$99",
        annual: "$79",
      },
      description: "For growing teams that need more power and advanced features.",
      features: {
        included: [
          "Up to 20 data sources",
          "10 GB data storage", 
          "Advanced AI analysis",
          "Custom visualizations",
          "Team collaboration",
          "API access",
          "Priority email support"
        ],
        excluded: [
          "Custom AI models",
          "White labeling",
          "Dedicated support"
        ]
      },
      buttonText: "Get Started",
      isPopular: true
    },
    {
      name: "Enterprise",
      price: {
        monthly: "$249",
        annual: "$199",
      },
      description: "For organizations with complex needs and large data volumes.",
      features: {
        included: [
          "Unlimited data sources",
          "15 GB data storage",
          "Custom AI models",
          "Advanced security",
          "White labeling",
          "Full API access",
          "Dedicated support manager",
          "Custom onboarding"
        ],
        excluded: []
      },
      buttonText: "Contact Sales"
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-primary-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-accent-500 font-semibold tracking-wider uppercase text-sm">Pricing</span>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mt-3 mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Choose the plan that's right for your business. All plans include a 14-day free trial.
          </p>
          
          {/* Billing toggle */}
          <div className="flex items-center justify-center mb-8">
            <span className={`mr-3 text-sm font-medium ${!isAnnual ? 'text-primary-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                isAnnual ? 'bg-black-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-gray-100 transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`ml-3 text-sm font-medium ${isAnnual ? 'text-primary-900' : 'text-gray-500'}`}>
              Annual <span className="text-accent-500 font-bold">(Save 20%)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:scale-105 ${
                plan.isPopular ? 'md:transform md:scale-110 md:z-10 border-2 border-accent-500' : ''
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-accent-500 text-white py-1 px-4 text-sm font-bold rounded-bl-lg">
                  Most Popular
                </div>
              )}
              
              <div className="p-8">
                <h3 className="text-xl font-bold text-primary-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-primary-900">
                    {isAnnual ? plan.price.annual : plan.price.monthly}
                  </span>
                  <span className="text-gray-600 ml-1">/ month / user</span>
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                <Link to="/dashboard">
                  <Button 
                    variant={plan.isPopular ? "accent" : "outline"} 
                    size="default" 
                    fullWidth
                  >
                    {plan.buttonText}
                  </Button>
                </Link>

                <div className="mt-6">
                  <p className="font-medium text-sm text-gray-700 mb-3">What's included:</p>
                  <ul className="space-y-2">
                    {plan.features.included.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-success-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">{feature}</span>
                      </li>
                    ))}
                    {plan.features.excluded.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <X className="h-5 w-5 text-gray-300 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-gray-400 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 max-w-3xl mx-auto text-center bg-white rounded-xl shadow-md p-8">
          <h3 className="text-2xl font-bold text-primary-900 mb-4">Need a custom solution?</h3>
          <p className="text-gray-600 mb-6">
            We offer tailored solutions for large enterprises with specific requirements.
            Contact our sales team to discuss your needs.
          </p>
          <Link to="/dashboard">
            <Button variant="secondary" size="lg">
              Contact Sales
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Pricing; 