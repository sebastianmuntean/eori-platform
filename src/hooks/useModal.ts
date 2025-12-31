'use client';

import { useState } from 'react';

export function useModal() {
  console.log('Step 1: Initializing useModal hook');
  
  const [isOpen, setIsOpen] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

  const openModal = (content?: React.ReactNode) => {
    console.log('Step 2: Opening modal');
    if (content) {
      setModalContent(content);
      console.log('✓ Modal content set');
    }
    setIsOpen(true);
    console.log('✓ Modal opened');
  };

  const closeModal = () => {
    console.log('Step 3: Closing modal');
    setIsOpen(false);
    setModalContent(null);
    console.log('✓ Modal closed and content cleared');
  };

  console.log('✓ useModal hook initialized');
  return {
    isOpen,
    modalContent,
    openModal,
    closeModal,
  };
}




