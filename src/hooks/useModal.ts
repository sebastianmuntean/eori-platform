'use client';

import { useState } from 'react';

export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

  const openModal = (content?: React.ReactNode) => {
    if (content) {
      setModalContent(content);
    }
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setModalContent(null);
  };

  return {
    isOpen,
    modalContent,
    openModal,
    closeModal,
  };
}




