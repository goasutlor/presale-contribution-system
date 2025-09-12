import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { UserIcon, EnvelopeIcon, IdentificationIcon, BuildingOfficeIcon, UserGroupIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface UserFormData {
  fullName: string;
  staffId: string;
  email: string;
  password: string;
  confirmPassword: string;
  involvedAccountNames: string[];
  involvedSaleNames: string[];
  involvedSaleEmails: string[];
  role: 'user' | 'admin';
  canViewOthers: boolean;
}

interface UserSubmitData {
  fullName: string;
  staffId: string;
  email: string;
  password?: string;
  involvedAccountNames: string[];
  involvedSaleNames: string[];
  involvedSaleEmails: string[];
  role: 'user' | 'admin';
  canViewOthers: boolean;
}

interface UserFormProps {
  onSubmit: (data: UserSubmitData) => void;
  onCancel: () => void;
  initialData?: Partial<UserFormData>;
  isEditing?: boolean;
  existingEmails?: string[];
  isAdmin?: boolean;
}

export default function UserForm({ onSubmit, onCancel, initialData, isEditing = false, existingEmails = [], isAdmin = false }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<UserFormData>({
    defaultValues: {
      fullName: '',
      staffId: '',
      email: '',
      password: '',
      confirmPassword: '',
      involvedAccountNames: [],
      involvedSaleNames: [],
      involvedSaleEmails: [],
      role: 'user',
      canViewOthers: false,
      ...initialData
    },
    mode: 'onChange'
  });

  const watchedPassword = watch('password');
  const watchedRole = watch('role');

  const validateEmail = (email: string) => {
    if (isEditing && email === initialData?.email) return true;
    return !existingEmails.includes(email) || 'อีเมลนี้ถูกใช้งานแล้ว';
  };

  const validatePassword = (password: string) => {
    if (isEditing && !password) return true; // Allow empty password when editing
    if (password.length < 6) return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    if (!/(?=.*[a-z])/.test(password)) return 'รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว';
    if (!/(?=.*[A-Z])/.test(password)) return 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว';
    if (!/(?=.*\d)/.test(password)) return 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว';
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    if (watchedPassword !== confirmPassword) return 'รหัสผ่านไม่ตรงกัน';
    return true;
  };

  const onFormSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      // Remove confirmPassword before submitting
      const { confirmPassword, ...submitData } = data;
      
      // If editing and password is empty, don't include it
      if (isEditing && !submitData.password) {
        delete (submitData as any).password;
      }
      
      await onSubmit(submitData as UserSubmitData);
      toast.success(isEditing ? 'อัปเดตผู้ใช้สำเร็จ' : 'สร้างผู้ใช้สำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAccount = () => {
    const currentAccounts = watch('involvedAccountNames');
    setValue('involvedAccountNames', [...currentAccounts, '']);
  };

  const removeAccount = (index: number) => {
    const currentAccounts = watch('involvedAccountNames');
    setValue('involvedAccountNames', currentAccounts.filter((_, i) => i !== index));
  };

  const updateAccount = (index: number, value: string) => {
    // Clean special characters for account names
    const cleanedValue = value
      .replace(/[\u0E47-\u0E4E]/g, '') // Remove Thai diacritical marks
      .replace(/[\u0E30-\u0E39]/g, '') // Remove Thai vowels
      .replace(/[\u0E40-\u0E44]/g, '') // Remove Thai consonants
      .replace(/[^\u0020-\u007E\u0E01-\u0E5B]/g, '') // Keep only ASCII and Thai characters
      .trim();
    
    const currentAccounts = watch('involvedAccountNames');
    const newAccounts = [...currentAccounts];
    newAccounts[index] = cleanedValue;
    setValue('involvedAccountNames', newAccounts);
  };

  const addSale = () => {
    const currentSales = watch('involvedSaleNames');
    const currentEmails = watch('involvedSaleEmails');
    setValue('involvedSaleNames', [...currentSales, '']);
    setValue('involvedSaleEmails', [...currentEmails, '']);
  };

  const removeSale = (index: number) => {
    const currentSales = watch('involvedSaleNames');
    const currentEmails = watch('involvedSaleEmails');
    setValue('involvedSaleNames', currentSales.filter((_, i) => i !== index));
    setValue('involvedSaleEmails', currentEmails.filter((_, i) => i !== index));
  };

  const updateSale = (index: number, field: 'name' | 'email', value: string) => {
    if (field === 'name') {
      // Clean special characters for sale names
      const cleanedValue = value
        .replace(/[\u0E47-\u0E4E]/g, '') // Remove Thai diacritical marks
        .replace(/[\u0E30-\u0E39]/g, '') // Remove Thai vowels
        .replace(/[\u0E40-\u0E44]/g, '') // Remove Thai consonants
        .replace(/[^\u0020-\u007E\u0E01-\u0E5B]/g, '') // Keep only ASCII and Thai characters
        .trim();
      
      const currentSales = watch('involvedSaleNames');
      const newSales = [...currentSales];
      newSales[index] = cleanedValue;
      setValue('involvedSaleNames', newSales);
    } else {
      const currentEmails = watch('involvedSaleEmails');
      const newEmails = [...currentEmails];
      newEmails[index] = value;
      setValue('involvedSaleEmails', newEmails);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isEditing ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
        </h2>
        <p className="text-gray-600">
          กรอกข้อมูลผู้ใช้สำหรับระบบ Contribution Management
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Basic Information Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
            ข้อมูลพื้นฐาน
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อ-นามสกุล <span className="text-red-500">*</span>
              </label>
              <Controller
                name="fullName"
                control={control}
                rules={{ required: 'กรุณากรอกชื่อ-นามสกุล' }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder="เช่น สมชาย ใจดี"
                    onChange={(e) => {
                      // Allow normal spaces and Thai characters; strip only control characters
                      const cleanedValue = e.target.value
                        .replace(/[\u0000-\u001F\u007F]/g, '');
                      field.onChange(cleanedValue);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            {/* Staff ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Staff ID <span className="text-red-500">*</span>
              </label>
              <Controller
                name="staffId"
                control={control}
                rules={{ required: 'กรุณากรอก Staff ID' }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder="เช่น EMP001"
                    onChange={(e) => {
                      const cleanedValue = e.target.value
                        .replace(/[\u0000-\u001F\u007F]/g, '')
                        .replace(/\s{2,}/g, ' ')
                        .trimStart();
                      field.onChange(cleanedValue);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              />
              {errors.staffId && (
                <p className="mt-1 text-sm text-red-600">{errors.staffId.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                อีเมล <span className="text-red-500">*</span>
              </label>
              <Controller
                name="email"
                control={control}
                rules={{ 
                  required: 'กรุณากรอกอีเมล',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'รูปแบบอีเมลไม่ถูกต้อง'
                  },
                  validate: validateEmail
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="email"
                    placeholder="เช่น user@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่าน {!isEditing && <span className="text-red-500">*</span>}
                {isEditing && !isAdmin && <span className="text-gray-500 text-xs"> (เว้นว่างถ้าไม่ต้องการเปลี่ยน)</span>}
                {isEditing && isAdmin && <span className="text-red-500 text-xs"> (Admin: กรอกเพื่อ Overwrite Password)</span>}
              </label>
              <div className="relative">
                <Controller
                  name="password"
                  control={control}
                  rules={{ 
                    required: !isEditing ? 'กรุณากรอกรหัสผ่าน' : false,
                    validate: isEditing && isAdmin ? validatePassword : (isEditing ? undefined : validatePassword)
                  }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isEditing ? (isAdmin ? 'กรอกรหัสผ่านใหม่เพื่อ Overwrite' : 'เว้นว่างถ้าไม่ต้องการเปลี่ยน') : 'รหัสผ่าน'}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            {(!isEditing || (isEditing && isAdmin && (watchedPassword?.length || 0) > 0)) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ยืนยันรหัสผ่าน {(!isEditing || (isEditing && isAdmin && (watchedPassword?.length || 0) > 0)) && (<span className="text-red-500">*</span>)}
                  {isEditing && isAdmin && (watchedPassword?.length || 0) > 0 && <span className="text-red-500 text-xs"> (Admin: ยืนยันรหัสผ่านใหม่)</span>}
                </label>
                <div className="relative">
                  <Controller
                    name="confirmPassword"
                    control={control}
                    rules={{ 
                      required: !isEditing ? 'กรุณายืนยันรหัสผ่าน' : ((isEditing && isAdmin && (watchedPassword?.length || 0) > 0) ? 'กรุณายืนยันรหัสผ่านใหม่' : false),
                      validate: validateConfirmPassword
                    }}
                    render={({ field }) => (
                      <input
                        {...field}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder={isEditing && isAdmin ? "ยืนยันรหัสผ่านใหม่" : "ยืนยันรหัสผ่าน"}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Account & Sale Assignment Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BuildingOfficeIcon className="h-5 w-5 mr-2 text-green-600" />
            การมอบหมาย Account และ Sale
          </h3>
          
          <div className="space-y-6">
            {/* Involved Account Names */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Account ที่เกี่ยวข้อง <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addAccount}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  เพิ่ม Account
                </button>
              </div>
              
              <Controller
                name="involvedAccountNames"
                control={control}
                rules={{ 
                  required: 'กรุณาระบุ Account อย่างน้อย 1 รายการ',
                  validate: (value) => value.length > 0 || 'กรุณาระบุ Account อย่างน้อย 1 รายการ'
                }}
                render={({ field }) => (
                  <div className="space-y-2">
                    {field.value.map((account, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={account}
                          onChange={(e) => updateAccount(index, e.target.value)}
                          placeholder="ชื่อ Account"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeAccount(index)}
                          className="px-2 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              />
              {errors.involvedAccountNames && (
                <p className="mt-1 text-sm text-red-600">{errors.involvedAccountNames.message}</p>
              )}
            </div>

            {/* Involved Sale Names & Emails */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Sale ที่เกี่ยวข้อง <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addSale}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-green-600 bg-green-100 hover:bg-green-200"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  เพิ่ม Sale
                </button>
              </div>
              
              <Controller
                name="involvedSaleNames"
                control={control}
                rules={{ 
                  required: 'กรุณาระบุ Sale อย่างน้อย 1 รายการ',
                  validate: (value) => value.length > 0 || 'กรุณาระบุ Sale อย่างน้อย 1 รายการ'
                }}
                render={({ field }) => (
                  <div className="space-y-3">
                    {field.value.map((sale, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={sale}
                          onChange={(e) => updateSale(index, 'name', e.target.value)}
                          placeholder="ชื่อ Sale"
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="email"
                            value={watch('involvedSaleEmails')[index] || ''}
                            onChange={(e) => updateSale(index, 'email', e.target.value)}
                            placeholder="อีเมล Sale"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeSale(index)}
                            className="px-2 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              />
              {errors.involvedSaleNames && (
                <p className="mt-1 text-sm text-red-600">{errors.involvedSaleNames.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Role & Permissions Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ShieldCheckIcon className="h-5 w-5 mr-2 text-purple-600" />
            บทบาทและสิทธิ์
          </h3>
          
          <div className="space-y-4">
            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                บทบาท <span className="text-red-500">*</span>
              </label>
              <Controller
                name="role"
                control={control}
                rules={{ required: 'กรุณาเลือกบทบาท' }}
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                      field.value === 'user'
                        ? 'border-blue-500 ring-2 ring-blue-500'
                        : 'border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="role"
                        value="user"
                        checked={field.value === 'user'}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="sr-only"
                      />
                      <div className="text-center w-full">
                        <div className="text-sm font-medium text-gray-900">User</div>
                        <div className="text-xs text-gray-500 mt-1">ผู้ใช้ทั่วไป</div>
                      </div>
                    </label>
                    
                    <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                      field.value === 'admin'
                        ? 'border-blue-500 ring-2 ring-blue-500'
                        : 'border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="role"
                        value="admin"
                        checked={field.value === 'admin'}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="sr-only"
                      />
                      <div className="text-center w-full">
                        <div className="text-sm font-medium text-gray-900">Admin</div>
                        <div className="text-xs text-gray-500 mt-1">ผู้ดูแลระบบ</div>
                      </div>
                    </label>
                  </div>
                )}
              />
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* Can View Others Permission */}
            <div>
              <Controller
                name="canViewOthers"
                control={control}
                rules={{ required: false }}
                render={({ field }) => (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      สามารถดูข้อมูลของผู้อื่นได้ (สำหรับหัวหน้าที่ทำงานใน Account เดียวกัน)
                    </span>
                  </label>
                )}
              />
              <p className="mt-1 text-xs text-gray-500">
                สิทธิ์นี้จะอนุญาตให้ผู้ใช้สามารถดูข้อมูล Contribution ของผู้อื่นได้ หากทำงานใน Account เดียวกัน
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'กำลังอัปเดต...' : 'กำลังสร้าง...'}
              </div>
            ) : (
              isEditing ? 'อัปเดตผู้ใช้' : 'สร้างผู้ใช้'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
