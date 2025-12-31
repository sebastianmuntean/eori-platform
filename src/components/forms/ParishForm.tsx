'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, Select, Modal } from '@/components/ui';
import type { Parish } from '@/hooks/useParishes';
import type { Diocese } from '@/hooks/useDioceses';
import type { Deanery } from '@/hooks/useDeaneries';

interface ParishFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Parish>) => Promise<boolean>;
  parish?: Parish | null;
  dioceses: Diocese[];
  deaneries: Deanery[];
  loading?: boolean;
}

export function ParishForm({
  isOpen,
  onClose,
  onSubmit,
  parish,
  dioceses,
  deaneries,
  loading = false,
}: ParishFormProps) {
  const [formData, setFormData] = useState({
    dioceseId: '',
    deaneryId: '',
    code: '',
    name: '',
    patronSaintDay: '',
    address: '',
    city: '',
    county: '',
    postalCode: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    website: '',
    priestName: '',
    vicarName: '',
    parishionerCount: '',
    foundedYear: '',
    notes: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter deaneries by selected diocese
  const filteredDeaneries = useMemo(() => {
    if (!formData.dioceseId) return [];
    return deaneries.filter((d) => d.dioceseId === formData.dioceseId);
  }, [deaneries, formData.dioceseId]);

  useEffect(() => {
    if (parish) {
      setFormData({
        dioceseId: parish.dioceseId || '',
        deaneryId: parish.deaneryId || '',
        code: parish.code || '',
        name: parish.name || '',
        patronSaintDay: parish.patronSaintDay || '',
        address: parish.address || '',
        city: parish.city || '',
        county: parish.county || '',
        postalCode: parish.postalCode || '',
        latitude: parish.latitude || '',
        longitude: parish.longitude || '',
        phone: parish.phone || '',
        email: parish.email || '',
        website: parish.website || '',
        priestName: parish.priestName || '',
        vicarName: parish.vicarName || '',
        parishionerCount: parish.parishionerCount?.toString() || '',
        foundedYear: parish.foundedYear?.toString() || '',
        notes: parish.notes || '',
        isActive: parish.isActive ?? true,
      });
    } else {
      setFormData({
        dioceseId: '',
        deaneryId: '',
        code: '',
        name: '',
        patronSaintDay: '',
        address: '',
        city: '',
        county: '',
        postalCode: '',
        latitude: '',
        longitude: '',
        phone: '',
        email: '',
        website: '',
        priestName: '',
        vicarName: '',
        parishionerCount: '',
        foundedYear: '',
        notes: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [parish, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      // Reset deaneryId if diocese changes
      if (name === 'dioceseId') {
        updated.deaneryId = '';
      }

      return updated;
    });

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

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'URL-ul trebuie să înceapă cu http:// sau https://';
    }

    if (formData.latitude && (isNaN(Number(formData.latitude)) || Number(formData.latitude) < -90 || Number(formData.latitude) > 90)) {
      newErrors.latitude = 'Latitudinea trebuie să fie între -90 și 90';
    }

    if (formData.longitude && (isNaN(Number(formData.longitude)) || Number(formData.longitude) < -180 || Number(formData.longitude) > 180)) {
      newErrors.longitude = 'Longitudinea trebuie să fie între -180 și 180';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const success = await onSubmit({
      ...formData,
      deaneryId: formData.deaneryId || null,
      patronSaintDay: formData.patronSaintDay || null,
      address: formData.address || null,
      city: formData.city || null,
      county: formData.county || null,
      postalCode: formData.postalCode || null,
      latitude: formData.latitude || null,
      longitude: formData.longitude || null,
      phone: formData.phone || null,
      email: formData.email || null,
      website: formData.website || null,
      priestName: formData.priestName || null,
      vicarName: formData.vicarName || null,
      parishionerCount: formData.parishionerCount ? parseInt(formData.parishionerCount) : null,
      foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : null,
      notes: formData.notes || null,
    } as Partial<Parish>);

    if (success) {
      onClose();
    }
  };

  const dioceseOptions = dioceses.map((d) => ({
    value: d.id,
    label: `${d.code} - ${d.name}`,
  }));

  const deaneryOptions = filteredDeaneries.map((d) => ({
    value: d.id,
    label: `${d.code} - ${d.name}`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={parish ? 'Editare Parohie' : 'Adăugare Parohie'}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Anulează
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {parish ? 'Salvează' : 'Adaugă'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hierarchy Selection */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Dieceză"
            name="dioceseId"
            value={formData.dioceseId}
            onChange={handleChange}
            options={dioceseOptions}
            placeholder="Selectează dieceza"
            error={errors.dioceseId}
            required
            disabled={loading || !!parish}
          />
          <Select
            label="Protopopiat"
            name="deaneryId"
            value={formData.deaneryId}
            onChange={handleChange}
            options={deaneryOptions}
            placeholder={formData.dioceseId ? 'Selectează protopopiatul' : 'Selectează mai întâi dieceza'}
            disabled={loading || !formData.dioceseId}
          />
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Cod"
            name="code"
            value={formData.code}
            onChange={handleChange}
            error={errors.code}
            placeholder="ex: PAR-001"
            required
            disabled={loading}
          />
          <Input
            label="Denumire"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="ex: Parohia Sf. Nicolae"
            required
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Hramul Bisericii"
            name="patronSaintDay"
            value={formData.patronSaintDay}
            onChange={handleChange}
            placeholder="ex: 6 Decembrie"
            disabled={loading}
          />
          <Input
            label="An Înființare"
            name="foundedYear"
            type="number"
            value={formData.foundedYear}
            onChange={handleChange}
            placeholder="ex: 1850"
            disabled={loading}
          />
        </div>

        {/* Address */}
        <Input
          label="Adresă"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Adresa completă"
          disabled={loading}
        />

        <div className="grid grid-cols-4 gap-4">
          <Input
            label="Oraș/Sat"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="ex: Cluj-Napoca"
            disabled={loading}
          />
          <Input
            label="Județ"
            name="county"
            value={formData.county}
            onChange={handleChange}
            placeholder="ex: Cluj"
            disabled={loading}
          />
          <Input
            label="Cod Poștal"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            placeholder="ex: 400000"
            disabled={loading}
          />
          <Input
            label="Nr. Enoriași"
            name="parishionerCount"
            type="number"
            value={formData.parishionerCount}
            onChange={handleChange}
            placeholder="ex: 500"
            disabled={loading}
          />
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Latitudine"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            error={errors.latitude}
            placeholder="ex: 46.7712"
            disabled={loading}
          />
          <Input
            label="Longitudine"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            error={errors.longitude}
            placeholder="ex: 23.6236"
            disabled={loading}
          />
        </div>

        {/* Clergy */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Paroh"
            name="priestName"
            value={formData.priestName}
            onChange={handleChange}
            placeholder="ex: Pr. Ioan Popescu"
            disabled={loading}
          />
          <Input
            label="Vicar"
            name="vicarName"
            value={formData.vicarName}
            onChange={handleChange}
            placeholder="ex: Pr. Vasile Ionescu"
            disabled={loading}
          />
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Telefon"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="ex: +40 264 123 456"
            disabled={loading}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="ex: parohie@email.ro"
            disabled={loading}
          />
        </div>

        <Input
          label="Website"
          name="website"
          value={formData.website}
          onChange={handleChange}
          error={errors.website}
          placeholder="ex: https://www.parohie.ro"
          disabled={loading}
        />

        {/* Notes */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Observații
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Notițe adiționale..."
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
            Parohie activă
          </label>
        </div>
      </form>
    </Modal>
  );
}
