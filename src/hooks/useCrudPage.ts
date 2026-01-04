'use client';

import { useState, useCallback, useMemo } from 'react';

export interface CrudPageState<T> {
  searchTerm: string;
  currentPage: number;
  showAddModal: boolean;
  showEditModal: boolean;
  selectedItem: T | null;
  deleteConfirm: string | null;
}

export interface CrudPageActions<T> {
  setSearchTerm: (value: string) => void;
  setCurrentPage: (page: number) => void;
  handleAdd: () => void;
  handleEdit: (item: T) => void;
  handleDelete: (id: string) => void;
  closeAddModal: () => void;
  closeEditModal: () => void;
  closeDeleteConfirm: () => void;
  resetFilters: () => void;
}

export interface UseCrudPageOptions<T> {
  initialPage?: number;
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  onAdd?: () => void;
  resetFiltersCallback?: () => void;
}

/**
 * Reusable hook for CRUD page state management
 * Provides common state and actions for list pages with add/edit/delete functionality
 */
export function useCrudPage<T extends { id: string }>(
  options: UseCrudPageOptions<T> = {}
): [CrudPageState<T>, CrudPageActions<T>] {
  const {
    initialPage = 1,
    onEdit,
    onDelete,
    onAdd,
    resetFiltersCallback,
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleAdd = useCallback(() => {
    onAdd?.();
    setShowAddModal(true);
  }, [onAdd]);

  const handleEdit = useCallback(
    (item: T) => {
      setSelectedItem(item);
      onEdit?.(item);
      setShowEditModal(true);
    },
    [onEdit]
  );

  const handleDelete = useCallback(
    (id: string) => {
      setDeleteConfirm(id);
      onDelete?.(id);
    },
    [onDelete]
  );

  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
    setSelectedItem(null);
  }, []);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedItem(null);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setCurrentPage(1);
    resetFiltersCallback?.();
  }, [resetFiltersCallback]);

  const state: CrudPageState<T> = useMemo(
    () => ({
      searchTerm,
      currentPage,
      showAddModal,
      showEditModal,
      selectedItem,
      deleteConfirm,
    }),
    [searchTerm, currentPage, showAddModal, showEditModal, selectedItem, deleteConfirm]
  );

  const setSearchTermWithReset = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const actions: CrudPageActions<T> = useMemo(
    () => ({
      setSearchTerm: setSearchTermWithReset,
      setCurrentPage,
      handleAdd,
      handleEdit,
      handleDelete,
      closeAddModal,
      closeEditModal,
      closeDeleteConfirm,
      resetFilters,
    }),
    [
      setSearchTermWithReset,
      handleAdd,
      handleEdit,
      handleDelete,
      closeAddModal,
      closeEditModal,
      closeDeleteConfirm,
      resetFilters,
    ]
  );

  return [state, actions];
}

