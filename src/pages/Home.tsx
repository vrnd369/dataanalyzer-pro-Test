import React from 'react';
import '../App.css';
import {} from '@mui/material';
import './home.css';
import Testimonials from './Testimonials';
import Pricing from './Pricing';
import HowItWorks from './HowItWorks';
import Features from './Features';
import Hero from './Hero';
import Footer from './Footer';
import Audiences from './Audiences';
import CTASection from './CTASection';
import BackgroundAnimation from '../components/ui/BackgroundAnimation';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const Home: React.FC = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode],
  );

  return (
    <ThemeProvider theme={theme}>
      <div style={{ color: 'black', position: 'relative', overflow: 'hidden' }}>
        <BackgroundAnimation />
        <Hero />
        {/* Features Section - Replaced with the Features component */}
        <Features />

        {/* How It Works Section - Added */}
        <HowItWorks />

        {/* Audiences Section - Added */}
        <Audiences />

        {/* Pricing Section */}
        <Pricing />
        <CTASection />
        
        <Testimonials />

        {/* Footer with Contact */}
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default Home; 
