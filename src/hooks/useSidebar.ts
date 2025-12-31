'use client';

import { useState, useEffect } from 'react';

export function useSidebar() {
  console.log('Step 1: Initializing useSidebar hook');
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    console.log('Step 2: Setting up sidebar state persistence');
    // Load from localStorage if available
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
      console.log('✓ Sidebar state loaded from localStorage:', savedState === 'true');
    }
  }, []);

  const toggleCollapse = () => {
    console.log('Step 3: Toggling sidebar collapse state');
    setIsCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem('sidebar-collapsed', String(newState));
      console.log('✓ Sidebar collapsed state updated:', newState);
      return newState;
    });
  };

  const toggleMobile = () => {
    console.log('Step 4: Toggling mobile sidebar');
    setIsMobileOpen((prev) => {
      console.log('✓ Mobile sidebar toggled:', !prev);
      return !prev;
    });
  };

  const closeMobile = () => {
    console.log('Step 5: Closing mobile sidebar');
    setIsMobileOpen(false);
    console.log('✓ Mobile sidebar closed');
  };

  console.log('✓ useSidebar hook initialized');
  return {
    isCollapsed,
    isMobileOpen,
    toggleCollapse,
    toggleMobile,
    closeMobile,
  };
}




