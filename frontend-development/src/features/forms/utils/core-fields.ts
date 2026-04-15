import type { FormBuilderField } from '../types/form-builder.types';

export const CORE_FIELDS: FormBuilderField[] = [
  {
    id: 'core-company-name',
    type: 'short-text',
    label: 'Nama Perusahaan / Client',
    note: 'Masukkan nama perusahaan atau nama client.',
    placeholder: 'PT Contoh Sejahtera',
    required: true,
    isCore: true
  },
  {
    id: 'core-pic-name',
    type: 'short-text',
    label: 'Nama PIC',
    note: 'Nama penanggung jawab utama.',
    placeholder: 'Nama PIC',
    required: true,
    isCore: true
  },
  {
    id: 'core-email',
    type: 'short-text',
    label: 'Email',
    note: 'Email aktif untuk komunikasi lanjutan.',
    placeholder: 'nama@perusahaan.com',
    required: true,
    isCore: true
  },
  {
    id: 'core-phone',
    type: 'short-text',
    label: 'Nomor Telepon / WhatsApp',
    note: 'Gunakan nomor yang aktif dan bisa dihubungi.',
    placeholder: '+62...',
    required: true,
    isCore: true
  }
];
