import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import type { LoginFormValues, LoginFormErrors } from '../types/auth.types';
import { authService } from '../services/auth.service';

export const useLoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormValues>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: LoginFormErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Email yang anda masukan tidak valid';
    }

    if (!formData.password) {
      newErrors.password = 'Password wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error on change
    if (errors[name as keyof LoginFormErrors] || errors.submit) {
      setErrors((prev) => ({ ...prev, [name]: undefined, submit: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsLoading(true);
      setErrors((prev) => ({ ...prev, submit: undefined }));

      try {
        const user = await authService.loginWithDummyAccount(formData);
        console.log('Login successful:', user);
        authService.setStoredAuthUser(user);
        navigate('/dashboard');
      } catch (err: any) {
        setErrors((prev) => ({ ...prev, submit: err.message || 'Login failed' }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return {
    formData,
    errors,
    isLoading,
    handleChange,
    handleSubmit,
  };
};
