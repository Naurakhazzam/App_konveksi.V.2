import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/organisms/Modal';
import { Heading, Label } from '@/components/atoms/Typography';
import TextInput from '@/components/atoms/Input/TextInput';
import Button from '@/components/atoms/Button';
import Select from '@/components/atoms/Select/Select';

export interface FormFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'color';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  showIf?: (values: Record<string, any>) => boolean;
}

export interface MasterFormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: FormFieldConfig[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
}

export default function MasterFormModal({
  open,
  onClose,
  title,
  fields,
  initialValues = {},
  onSubmit,
}: MasterFormModalProps) {
  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => {
    if (open) {
      setValues(initialValues);
    }
  }, [open, initialValues]);

  const handleChange = (key: string, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)' }}>
          <Heading level={4}>{title}</Heading>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {fields.map((field) => {
            if (field.showIf && !field.showIf(values)) {
              return null;
            }

            return (
              <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Label>{field.label} {field.required && <span style={{ color: 'var(--color-danger)' }}>*</span>}</Label>
                {field.type === 'text' && (
                  <TextInput
                    value={values[field.key] || ''}
                    onChange={(val) => handleChange(field.key, val)}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}
                {field.type === 'number' && (
                  <input
                    type="number"
                    value={values[field.key] || ''}
                    onChange={(e) => handleChange(field.key, parseFloat(e.target.value))}
                    placeholder={field.placeholder}
                    required={field.required}
                    style={{
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '14px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      outline: 'none',
                      width: '100%',
                    }}
                  />
                )}
                {field.type === 'select' && (
                  <Select
                    value={values[field.key] || ''}
                    onChange={(val) => handleChange(field.key, val)}
                    options={field.options || []}
                    placeholder={field.placeholder}
                  />
                )}
                {field.type === 'color' && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div 
                      style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '8px', 
                        backgroundColor: values[field.key] || '#000000',
                        border: '1px solid var(--color-border)'
                      }} 
                    />
                    <TextInput
                      value={values[field.key] || ''}
                      onChange={(val) => handleChange(field.key, val)}
                      placeholder="#000000"
                      required={field.required}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--color-bg-secondary)', borderRadius: '0 0 12px 12px' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
          <Button type="submit" variant="primary">Simpan</Button>
        </div>
      </form>
    </Modal>
  );
}
