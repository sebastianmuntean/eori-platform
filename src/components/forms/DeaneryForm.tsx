'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Modal } from '@/src/components/ui';
import type { Deanery } from '@/src/hooks/useDeaneries';
import type { Diocese } from '@/src/hooks/useDioceses';

interface DeaneryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Deanery>) => Promise<boolean>;
  deanery?: Deanery | null;
  dioceses: Diocese[];
  loading?: boolean;
}

export function DeaneryForm({
  isOpen,
  onClose,
  onSubmit,
  deanery,
  dioceses,
  loading = false,
}: DeaneryFormProps) {
  const [formData, setFormData] = useState({
    dioceseId: '',
    code: '',
    name: '',
    address: '',
    city: '',
    county: '',
    deanName: '',
    phone: '',
    email: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (deanery) {
      setFormData({
        dioceseId: deanery.dioceseId || '',
        code: deanery.code || '',
        name: deanery.name || '',
        address: deanery.address || '',
        city: deanery.city || '',
        county: deanery.county || '',
        deanName: deanery.deanName || '',
        phone: deanery.phone || '',
        email: deanery.email || '',
        isActive: deanery.isActive ?? true,
      });
    } else {
      setFormData({
        dioceseId: '',
        code: '',
        name: '',
        address: '',
        city: '',
        county: '',
        deanName: '',
        phone: '',
        email: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [deanery, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.dioceseId) {
      newErrors.dioceseId = 'Dieceza este obligatorie';
    }

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
      deanName: formData.deanName || null,
      phone: formData.phone || null,
      email: formData.email || null,
    });

    if (success) {
      onClose();
    }
  };

  const dioceseOptions = dioceses.map((d) => ({
    value: d.id,
    label: `${d.code} - ${d.name}`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={deanery ? 'Editare Protopopiat' : 'Adăugare Protopopiat'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Anulează
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {deanery ? 'Salvează' : 'Adaugă'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Dieceză"
          name="dioceseId"
          value={formData.dioceseId}
          onChange={handleChange}
          options={dioceseOptions}
          placeholder="Selectează dieceza"
          error={errors.dioceseId}
          required
          disabled={loading || !!deanery} // Cannot change diocese on edit
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Cod"
            name="code"
            value={formData.code}
            onChange={handleChange}
            error={errors.code}
            placeholder="ex: PROTO-01"
            required
            disabled={loading}
          />
          <Input
            label="Denumire"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="ex: Protopopiatul Alba Iulia"
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

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <Input
          label="Nume Protopop"
          name="deanName"
          value={formData.deanName}
          onChange={handleChange}
          placeholder="ex: Pr. Ioan Popescu"
          disabled={loading}
        />

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
            placeholder="ex: protopopiat@dieceza.ro"
            disabled={loading}
          />
        </div>

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
            Protopopiat activ
          </label>
        </div>
      </form>
    </Modal>
  );
}
