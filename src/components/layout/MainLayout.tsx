import React from 'react';
import { MainContent } from './MainContent'; // Adjust path as needed
// import { Header } from '../common/Header'; // Placeholder for Header import - adjust path as needed

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      {/* If you want to add a header, uncomment this: */}
      {/* <Header /> */}
      <MainContent>
        {children}
      </MainContent>
    </div>
  );
};

export default MainLayout; 