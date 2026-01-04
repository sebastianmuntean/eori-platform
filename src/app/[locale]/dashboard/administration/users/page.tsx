'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { useUsers, User, ImportResult } from '@/hooks/useUsers';
import { downloadUserImportTemplate } from '@/lib/utils';
import { useTranslations } from 'next-intl';

type UserRow = User & {
  [key: string]: any;
};

export default function UtilizatoriPage() {
  console.log('Step 1: Rendering Users administration page');

  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');

  const {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    importUsers,
    exportUsers,
    resendConfirmationEmail,
  } = useUsers();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showImportSection, setShowImportSection] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    role: 'paroh' as 'episcop' | 'vicar' | 'paroh' | 'secretar' | 'contabil',
    address: '',
    city: '',
    phone: '',
  });
  const [newUserErrors, setNewUserErrors] = useState<{
    name?: string;
    email?: string;
    general?: string;
  }>({});
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    phone: '',
  });
  const [editUserErrors, setEditUserErrors] = useState<{
    name?: string;
    email?: string;
    general?: string;
  }>({});

  // Fetch users on mount and when filters change
  useEffect(() => {
    console.log('Step 2: Fetching users with filters');
    fetchUsers({
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      status: statusFilter || undefined,
      approvalStatus: approvalStatusFilter || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }, [currentPage, searchTerm, statusFilter, approvalStatusFilter, fetchUsers]);

  const handleSearch = (value: string) => {
    console.log('Step 3: Handling search:', value);
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleImport = async () => {
    console.log('Step 4: Handling file import');
    if (!importFile) {
      console.log('❌ No file selected');
      alert('Te rugăm să selectezi un fișier Excel pentru import.');
      return;
    }

    // Validate file type
    const fileExtension = importFile.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      console.log('❌ Invalid file type');
      alert('Te rugăm să selectezi un fișier Excel (.xlsx sau .xls).');
      setImportFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    console.log(`  Importing file: ${importFile.name}`);
    const result = await importUsers(importFile);
    if (result) {
      setImportResult(result);
      setImportFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      console.log(`✓ Import completed: ${result.successful} successful, ${result.failed} failed`);
      
      // Show success message if all imports were successful
      if (result.failed === 0 && result.successful > 0) {
        console.log(`✓ All ${result.successful} users imported successfully`);
      }
    } else {
      // Error is already set in the useUsers hook and displayed in error section
      console.log('❌ Import failed - error already displayed');
    }
  };

  const handleExport = async () => {
    console.log('Step 5: Handling export');
    await exportUsers({
      search: searchTerm || undefined,
      status: statusFilter || undefined,
      approvalStatus: approvalStatusFilter || undefined,
    });
  };

  const handleDelete = async (userId: string) => {
    console.log(`Step 6: Deleting user ${userId}`);
    if (confirm('Sigur doriți să ștergeți acest utilizator?')) {
      const success = await deleteUser(userId);
      if (success) {
        console.log(`✓ User deleted: ${userId}`);
      }
    }
  };

  const handleToggleActive = async (user: User) => {
    console.log(`Step 7: Toggling active status for user ${user.id}`);
    // Note: Schema doesn't have isActive yet, so this is a placeholder
    console.log('⚠️ isActive field not yet available in schema');
    // await updateUser(user.id, { isActive: !user.isActive });
  };

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return t('noData');
    try {
      return new Date(date).toLocaleDateString(locale === 'it' ? 'it-IT' : locale === 'en' ? 'en-US' : 'ro-RO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return t('noData');
    }
  };

  const columns = [
    {
      key: 'name' as keyof UserRow,
      label: t('name'),
      sortable: true,
      render: (value: any, row: UserRow) => (
        <span className="font-medium text-text-primary">
          {value || row.email || t('noData')}
        </span>
      ),
    },
    {
      key: 'email' as keyof UserRow,
      label: t('email'),
      sortable: true,
    },
    {
      key: 'address' as keyof UserRow,
      label: t('address'),
      sortable: true,
      render: (value: any) => value || t('noData'),
    },
    {
      key: 'city' as keyof UserRow,
      label: t('city'),
      sortable: true,
      render: (value: any) => value || t('noData'),
    },
    {
      key: 'phone' as keyof UserRow,
      label: t('phone'),
      sortable: true,
      render: (value: any) => value || t('noData'),
    },
    {
      key: 'role' as keyof UserRow,
      label: t('role'),
      sortable: false,
      render: () => (
        <Badge variant="secondary" size="sm">
          {t('noData')}
        </Badge>
      ),
    },
    {
      key: 'status' as keyof UserRow,
      label: t('status'),
      sortable: false,
      render: () => (
        <Badge variant="success" size="sm">
          {t('active')}
        </Badge>
      ),
    },
    {
      key: 'approvalStatus' as keyof UserRow,
      label: t('approvalStatus'),
      sortable: false,
      render: () => (
        <Badge variant="warning" size="sm">
          {t('pending')}
        </Badge>
      ),
    },
    {
      key: 'createdAt' as keyof UserRow,
      label: t('createdAt'),
      sortable: true,
      render: (value: any) => formatDate(value),
    },
    {
      key: 'actions' as keyof UserRow,
      label: t('actions'),
      sortable: false,
      render: (_: any, row: UserRow) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          }
          items={[
            {
              label: t('view'),
              onClick: () => {
                console.log(`View user: ${row.id}`);
                // TODO: Open user detail modal/page
              },
            },
            {
              label: t('edit'),
              onClick: () => {
                console.log(`Step 1: Edit user button clicked for user ${row.id}`);
                const userToEdit = users.find(u => u.id === row.id);
                if (userToEdit) {
                  console.log(`Step 2: Setting up edit modal for user: ${userToEdit.email}`);
                  setSelectedUser(userToEdit);
                  setEditUserData({
                    name: userToEdit.name || '',
                    email: userToEdit.email || '',
                    address: userToEdit.address || '',
                    city: userToEdit.city || '',
                    phone: userToEdit.phone || '',
                  });
                  setEditUserErrors({});
                  setShowEditUserModal(true);
                  console.log('✓ Edit modal opened');
                } else {
                  console.log(`❌ User ${row.id} not found in users list`);
                }
              },
            },
            {
              label: t('toggleActive'),
              onClick: () => handleToggleActive(row as User),
            },
            {
              label: t('resendConfirmation'),
              onClick: async () => {
                console.log(`Resend confirmation email: ${row.id}`);
                await resendConfirmationEmail(row.id);
              },
            },
            {
              label: t('delete'),
              onClick: () => handleDelete(row.id),
              variant: 'danger',
            },
          ]}
          align="right"
        />
      ),
    },
  ];

  const breadcrumbs = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('administration'), href: `/${locale}/dashboard/administration` },
    { label: t('utilizatori') },
  ];

  console.log('✓ Rendering users page');
  return (
    <div>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">
            {t('utilizatori')}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowImportSection(!showImportSection)}
          >
            {showImportSection ? t('hideImport') : t('importFromExcel')}
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={loading}>
            {t('exportToExcel')}
          </Button>
          <Button onClick={() => {
            console.log('Add user button clicked');
            setShowAddUserModal(true);
            setNewUserData({ name: '', email: '', role: 'paroh' });
            setNewUserErrors({});
          }}>
            {t('addUser')}
          </Button>
        </div>
      </div>

      {/* Import Section */}
      {showImportSection && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-text-primary">
              {t('importUsers')}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {t('importDescription')}
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      console.log('File selected:', file.name);
                      setImportFile(file);
                      setImportResult(null);
                    }
                  }}
                  className="hidden"
                />
                <Button 
                  variant="outline"
                  onClick={() => {
                    console.log('Select file button clicked');
                    fileInputRef.current?.click();
                  }}
                >
                  {t('selectFile')}
                </Button>
                {importFile && (
                  <span className="text-sm text-text-secondary">
                    {importFile.name}
                  </span>
                )}
                <Button
                  onClick={handleImport}
                  disabled={!importFile || loading}
                  isLoading={loading}
                >
                  {t('import')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    console.log('Step 1: Download template button clicked');
                    try {
                      await downloadUserImportTemplate();
                      console.log('✓ Template download completed');
                    } catch (error) {
                      console.error('❌ Error downloading template:', error);
                      alert(t('templateDownloadError'));
                    }
                  }}
                >
                  {t('downloadTemplate')}
                </Button>
              </div>

              {importResult && (
                <div className={`mt-4 p-4 rounded-md ${
                  importResult.failed === 0 
                    ? 'bg-success bg-opacity-10 border border-success' 
                    : importResult.successful === 0
                    ? 'bg-danger bg-opacity-10 border border-danger'
                    : 'bg-bg-secondary border border-border'
                }`}>
                  <h3 className="font-semibold text-text-primary mb-2">
                    {t('importResults')}
                  </h3>
                  {importResult.failed === 0 && importResult.successful > 0 && (
                    <div className="mb-2 text-sm text-success font-medium">
                      ✓ {t('importSuccess')}
                    </div>
                  )}
                  {importResult.successful === 0 && importResult.failed > 0 && (
                    <div className="mb-2 text-sm text-danger font-medium">
                      ✗ {t('importFailed')}
                    </div>
                  )}
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-text-secondary">{t('totalRowsProcessed')}</span>{' '}
                      <span className="font-medium">{importResult.total}</span>
                    </div>
                    <div>
                      <span className="text-text-secondary">{t('importedSuccessfully')}</span>{' '}
                      <span className="font-medium text-success">
                        {importResult.successful}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-secondary">{t('failed')}</span>{' '}
                      <span className="font-medium text-danger">
                        {importResult.failed}
                      </span>
                    </div>
                    {importResult.errors.length > 0 && (
                      <div className="mt-3">
                        <details className="cursor-pointer">
                          <summary className="text-text-secondary hover:text-text-primary font-medium">
                            {t('viewErrors')} ({importResult.errors.length})
                          </summary>
                          <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                            {importResult.errors.map((error, idx) => (
                              <div key={idx} className="text-xs p-2 bg-danger bg-opacity-5 rounded border border-danger border-opacity-20">
                                <div className="font-medium text-danger">{t('row')} {error.row}</div>
                                <div className="text-text-secondary">{t('emailLabel')} {error.email}</div>
                                <div className="text-danger mt-1">{error.error}</div>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-danger bg-opacity-10 border border-danger rounded-md">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-lg font-semibold text-text-primary">
              {t('allUsers')}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-64">
                <Input
                  placeholder={t('searchByNameOrEmail')}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  }
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-border rounded-md bg-bg-primary text-text-primary text-sm"
              >
                <option value="">{t('allStatuses')}</option>
                <option value="active">{t('active')}</option>
                <option value="inactive">{t('inactive')}</option>
              </select>
              <select
                value={approvalStatusFilter}
                onChange={(e) => {
                  setApprovalStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-border rounded-md bg-bg-primary text-text-primary text-sm"
              >
                <option value="">{t('allApprovals')}</option>
                <option value="pending">{t('pending')}</option>
                <option value="approved">{t('approved')}</option>
                <option value="rejected">{t('rejected')}</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {loading && users.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              {t('loading')}
            </div>
          ) : (
            <>
              <Table
                data={users as UserRow[]}
                columns={columns}
                emptyMessage={t('noUsers')}
              />

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="text-sm text-text-secondary">
                    {t('showingResults')} {((pagination.page - 1) * pagination.pageSize) + 1} -{' '}
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)} {t('ofTotal')}{' '}
                    {pagination.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                    >
                      {t('previous')}
                    </Button>
                    <span className="text-sm text-text-secondary">
                      {t('pageOf')} {pagination.page} {t('ofTotal')} {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages || loading}
                    >
                      {t('next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditUserModal}
        onClose={() => {
          console.log('Step 1: Closing edit user modal');
          setShowEditUserModal(false);
          setSelectedUser(null);
          setEditUserData({ name: '', email: '', address: '', city: '', phone: '' });
          setEditUserErrors({});
          console.log('✓ Edit modal closed');
        }}
        title={t('editUser')}
        size="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            console.log('Step 1: Edit user form submitted');
            console.log('  User ID:', selectedUser?.id);
            console.log('  Form data:', editUserData);

            if (!selectedUser) {
              console.log('❌ No user selected for editing');
              setEditUserErrors({ general: t('userNotSelected') });
              return;
            }

            // Validate form
            const errors: typeof editUserErrors = {};
            if (!editUserData.name.trim()) {
              errors.name = t('nameRequired');
            }
            if (!editUserData.email.trim()) {
              errors.email = t('emailRequired');
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editUserData.email)) {
              errors.email = t('emailInvalid');
            }

            setEditUserErrors(errors);

            if (Object.keys(errors).length > 0) {
              console.log('❌ Form validation failed:', errors);
              return;
            }

            console.log('Step 2: Updating user:', selectedUser.id);
            const updateData: {
              name?: string;
              email?: string;
              address?: string;
              city?: string;
              phone?: string;
            } = {};

            // Only include fields that have changed
            // Normalize null to empty string for comparison
            const currentName = selectedUser.name || '';
            const currentEmail = selectedUser.email || '';
            const currentAddress = selectedUser.address || '';
            const currentCity = selectedUser.city || '';
            const currentPhone = selectedUser.phone || '';
            
            if (editUserData.name.trim() !== currentName) {
              updateData.name = editUserData.name.trim();
              console.log(`  Name changed: "${currentName}" -> "${updateData.name}"`);
            }
            if (editUserData.email.trim() !== currentEmail) {
              updateData.email = editUserData.email.trim();
              console.log(`  Email changed: "${currentEmail}" -> "${updateData.email}"`);
            }
            if (editUserData.address.trim() !== currentAddress) {
              updateData.address = editUserData.address.trim() || null;
              console.log(`  Address changed: "${currentAddress}" -> "${updateData.address}"`);
            }
            if (editUserData.city.trim() !== currentCity) {
              updateData.city = editUserData.city.trim() || null;
              console.log(`  City changed: "${currentCity}" -> "${updateData.city}"`);
            }
            if (editUserData.phone.trim() !== currentPhone) {
              updateData.phone = editUserData.phone.trim() || null;
              console.log(`  Phone changed: "${currentPhone}" -> "${updateData.phone}"`);
            }

            if (Object.keys(updateData).length === 0) {
              console.log('⚠️ No changes detected');
              setEditUserErrors({ general: t('noChanges') });
              return;
            }

            console.log('Step 3: Calling updateUser with data:', updateData);
            const success = await updateUser(selectedUser.id, updateData);

            if (success) {
              console.log('✓ User updated successfully');
              setShowEditUserModal(false);
              setSelectedUser(null);
              setEditUserData({ name: '', email: '', address: '', city: '', phone: '' });
              setEditUserErrors({});
            } else {
              console.log('❌ Failed to update user');
              setEditUserErrors({ general: t('userUpdateError') });
            }
          }}
        >
          <div className="space-y-4">
            {editUserErrors.general && (
              <div className="p-3 rounded-md bg-danger bg-opacity-10 border border-danger text-danger text-sm">
                {editUserErrors.general}
              </div>
            )}

            <Input
              label={t('name')}
              type="text"
              value={editUserData.name}
              onChange={(e) => {
                setEditUserData({ ...editUserData, name: e.target.value });
                if (editUserErrors.name) {
                  setEditUserErrors({ ...editUserErrors, name: undefined });
                }
              }}
              error={editUserErrors.name}
              required
              disabled={loading}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
            />

            <Input
              label={t('email')}
              type="email"
              value={editUserData.email}
              onChange={(e) => {
                setEditUserData({ ...editUserData, email: e.target.value });
                if (editUserErrors.email) {
                  setEditUserErrors({ ...editUserErrors, email: undefined });
                }
              }}
              error={editUserErrors.email}
              required
              disabled={loading}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              }
            />

            <Input
              label={t('address')}
              type="text"
              value={editUserData.address}
              onChange={(e) => {
                setEditUserData({ ...editUserData, address: e.target.value });
              }}
              disabled={loading}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              }
            />

            <Input
              label={t('city')}
              type="text"
              value={editUserData.city}
              onChange={(e) => {
                setEditUserData({ ...editUserData, city: e.target.value });
              }}
              disabled={loading}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              }
            />

            <Input
              label={t('phone')}
              type="tel"
              value={editUserData.phone}
              onChange={(e) => {
                setEditUserData({ ...editUserData, phone: e.target.value });
              }}
              disabled={loading}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              }
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  console.log('Cancel button clicked in edit modal');
                  setShowEditUserModal(false);
                  setSelectedUser(null);
                  setEditUserData({ name: '', email: '', address: '', city: '', phone: '' });
                  setEditUserErrors({});
                }}
                disabled={loading}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" isLoading={loading} disabled={loading}>
                {t('saveChanges')}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddUserModal}
        onClose={() => {
          console.log('Closing add user modal');
          setShowAddUserModal(false);
          setNewUserData({ name: '', email: '', role: 'paroh', address: '', city: '', phone: '' });
          setNewUserErrors({});
        }}
        title={t('addNewUser')}
        size="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            console.log('Step 1: Add user form submitted');

            // Validate form
            const errors: typeof newUserErrors = {};
            if (!newUserData.name.trim()) {
              errors.name = t('nameRequired');
            }
            if (!newUserData.email.trim()) {
              errors.email = t('emailRequired');
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserData.email)) {
              errors.email = t('emailInvalid');
            }

            setNewUserErrors(errors);

            if (Object.keys(errors).length > 0) {
              console.log('❌ Form validation failed');
              return;
            }

            console.log('Step 2: Creating user:', newUserData.email);
            const success = await createUser({
              email: newUserData.email.trim(),
              name: newUserData.name.trim(),
              role: newUserData.role,
              address: newUserData.address.trim() || undefined,
              city: newUserData.city.trim() || undefined,
              phone: newUserData.phone.trim() || undefined,
              isActive: true,
              approvalStatus: 'pending',
            });

            if (success) {
              console.log('✓ User created successfully');
              setShowAddUserModal(false);
              setNewUserData({ name: '', email: '', role: 'paroh', address: '', city: '', phone: '' });
              setNewUserErrors({});
            } else {
              console.log('❌ Failed to create user');
              setNewUserErrors({ general: t('userCreateError') });
            }
          }}
        >
          <div className="space-y-4">
            {newUserErrors.general && (
              <div className="p-3 rounded-md bg-danger bg-opacity-10 border border-danger text-danger text-sm">
                {newUserErrors.general}
              </div>
            )}

            <Input
              label={t('name')}
              type="text"
              value={newUserData.name}
              onChange={(e) => {
                setNewUserData({ ...newUserData, name: e.target.value });
                if (newUserErrors.name) {
                  setNewUserErrors({ ...newUserErrors, name: undefined });
                }
              }}
              error={newUserErrors.name}
              required
              disabled={loading}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
            />

            <Input
              label={t('email')}
              type="email"
              value={newUserData.email}
              onChange={(e) => {
                setNewUserData({ ...newUserData, email: e.target.value });
                if (newUserErrors.email) {
                  setNewUserErrors({ ...newUserErrors, email: undefined });
                }
              }}
              error={newUserErrors.email}
              required
              disabled={loading}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              }
            />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('role')}
              </label>
              <select
                value={newUserData.role}
                onChange={(e) => {
                  setNewUserData({
                    ...newUserData,
                    role: e.target.value as typeof newUserData.role,
                  });
                }}
                disabled={loading}
                className="w-full px-3 py-2 border border-border rounded-md bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="episcop">Episcop</option>
                <option value="vicar">Vicar</option>
                <option value="paroh">Paroh</option>
                <option value="secretar">Secretar</option>
                <option value="contabil">Contabil</option>
              </select>
              <p className="mt-1 text-xs text-text-secondary">
                {t('userWillReceiveEmail')}
              </p>
            </div>

            <Input
              label={t('address')}
              type="text"
              value={newUserData.address}
              onChange={(e) => {
                setNewUserData({ ...newUserData, address: e.target.value });
              }}
              disabled={loading}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              }
            />

            <Input
              label={t('city')}
              type="text"
              value={newUserData.city}
              onChange={(e) => {
                setNewUserData({ ...newUserData, city: e.target.value });
              }}
              disabled={loading}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              }
            />

            <Input
              label={t('phone')}
              type="tel"
              value={newUserData.phone}
              onChange={(e) => {
                setNewUserData({ ...newUserData, phone: e.target.value });
              }}
              disabled={loading}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              }
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  console.log('Cancel button clicked');
                  setShowAddUserModal(false);
                  setNewUserData({ name: '', email: '', role: 'paroh', address: '', city: '', phone: '' });
                  setNewUserErrors({});
                }}
                disabled={loading}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" isLoading={loading} disabled={loading}>
                {t('createUser')}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

