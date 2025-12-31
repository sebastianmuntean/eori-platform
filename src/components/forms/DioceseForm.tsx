'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Modal } from '@/src/components/ui';
import type { Diocese } from '@/src/hooks/useDioceses';

interface DioceseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Diocese>) => Promise<boolean>;
  diocese?: Diocese | null;
  loading?: boolean;
}

export function DioceseForm({
  isOpen,
  onClose,
  onSubmit,
  diocese,
  loading = false,
}: DioceseFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    city: '',
    county: '',
    country: 'România',
    phone: '',
    email: '',
    website: '',
    bishopName: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (diocese) {
      setFormData({
        code: diocese.code || '',
        name: diocese.name || '',
        address: diocese.address || '',
        city: diocese.city || '',
        county: diocese.county || '',
        country: diocese.country || 'România',
        phone: diocese.phone || '',
        email: diocese.email || '',
        website: diocese.website || '',
        bishopName: diocese.bishopName || '',
        isActive: diocese.isActive ?? true,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        address: '',
        city: '',
        county: '',
        country: 'România',
        phone: '',
        email: '',
        website: '',
        bishopName: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [diocese, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Codul este obligatoriu';
    } else if (!/^[A-Z0-9-]+$/.test(formData.code)) {
      newErrors.code = 'Codul poate conține doar litere mari, cifre și cratimă';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Denumirea este obligatorie';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Adresa de email nu este validă';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'URL-ul trebuie să înceapă cu http:// sau https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const success = await onSubmit({
      ...formData,
      address: formData.address || null,
      city: formData.city || null,
      county: formData.county || null,
      phone: formData.phone || null,
      email: formData.email || null,
      website: formData.website || null,
      bishopName: formData.bishopName || null,
    });

    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={diocese ? 'Editare Dieceză' : 'Adăugare Dieceză'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Anulează
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {diocese ? 'Salvează' : 'Adaugă'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Cod"
            name="code"
            value={formData.code}
            onChange={handleChange}
            error={errors.code}
            placeholder="ex: ALBA"
            required
            disabled={loading}
          />
          <Input
            label="Denumire"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="ex: Arhiepiscopia Alba Iulia"
            required
            disabled={loading}
          />
        </div>

        <Input
          label="Adresă"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Adresa completă"
          disabled={loading}
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Oraș"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="ex: Alba Iulia"
            disabled={loading}
          />
          <Input
            label="Județ"
            name="county"
            value={formData.county}
            onChange={handleChange}
            placeholder="ex: Alba"
            disabled={loading}
          />
          <Input
            label="Țară"
            name="country"
            value={formData.country}
            onChange={handleChange}
            placeholder="ex: România"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Telefon"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="ex: +40 258 123 456"
            disabled={loading}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="ex: contact@dieceza.ro"
            disabled={loading}
          />
        </div>

        <Input
          label="Website"
          name="website"
          value={formData.website}
          onChange={handleChange}
          error={errors.website}
          placeholder="ex: https://www.dieceza.ro"
          disabled={loading}
        />

        <Input
          label="Nume Episcop"
          name="bishopName"
          value={formData.bishopName}
          onChange={handleChange}
          placeholder="ex: PS Părinte Ioan"
          disabled={loading}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={loading}
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            Dieceză activă
          </label>
        </div>
      </form>
    </Modal>
  );
}
