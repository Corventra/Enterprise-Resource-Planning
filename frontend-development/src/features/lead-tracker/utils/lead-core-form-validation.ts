export interface LeadCoreFormValues {
  companyName: string;
  companyAddress: string;
  picName: string;
  email: string;
  phoneNumber: string;
  desiredServices?: string;
}

export interface LeadCoreFormErrors {
  companyName?: string;
  companyAddress?: string;
  picName?: string;
  email?: string;
  phoneNumber?: string;
}

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const validateLeadCoreFormValues = (values: LeadCoreFormValues): LeadCoreFormErrors => {
  const errors: LeadCoreFormErrors = {};

  if (!values.companyName.trim()) {
    errors.companyName = 'Nama perusahaan wajib diisi.';
  }
  if (!values.companyAddress.trim()) {
    errors.companyAddress = 'Alamat perusahaan wajib diisi.';
  }
  if (!values.picName.trim()) {
    errors.picName = 'Nama PIC wajib diisi.';
  }
  if (!values.email.trim()) {
    errors.email = 'Email wajib diisi.';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Format email tidak valid.';
  }
  if (!values.phoneNumber.trim()) {
    errors.phoneNumber = 'Nomor telepon wajib diisi.';
  }

  return errors;
};

export const hasLeadCoreFormErrors = (errors: LeadCoreFormErrors): boolean =>
  Object.keys(errors).length > 0;
