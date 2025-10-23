import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { CalendarIcon, DocumentTextIcon, CurrencyDollarIcon, ChartBarIcon, UserGroupIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

interface ContributionFormData {
  title: string;
  accountName: string;
  saleName: string;
  saleEmail: string;
  contributionType: 'technical' | 'business' | 'relationship' | 'innovation' | 'other';
  impact: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  estimatedImpactValue?: number;
  description: string;
  contributionMonth: string;
  tags: string[];
}

interface ContributionFormProps {
  user: {
    fullName: string;
    staffId: string;
    involvedAccountNames: string[];
    involvedSaleNames: string[];
    involvedSaleEmails: string[];
  };
  onSubmit: (data: ContributionFormData, action: 'draft' | 'submit') => void;
  onCancel: () => void;
  initialData?: any; // For editing existing contribution
  isEditing?: boolean; // To distinguish between create and edit mode
}

const CONTRIBUTION_TYPES = [
  { value: 'technical', label: 'Technical', description: 'งานด้านเทคนิค' },
  { value: 'business', label: 'Business', description: 'งานด้านธุรกิจ' },
  { value: 'relationship', label: 'Relationship', description: 'งานด้านความสัมพันธ์' },
  { value: 'innovation', label: 'Innovation', description: 'งานด้านนวัตกรรม' },
  { value: 'other', label: 'Other', description: 'อื่นๆ' }
];

const IMPACT_LEVELS = [
  { value: 'low', label: '🌱 Routine Contribution', description: 'งานย่อย/งาน routine แต่ยังมีค่า', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: '⭐ Team-Level Impact', description: 'มีผลในระดับทีม/แผนก', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: '🔥 Department/Org-Level Impact', description: 'มีผลกระทบต่อองค์กรชัดเจน', color: 'bg-red-100 text-red-800' },
  { value: 'critical', label: '💎 Strategic Impact', description: 'มีผลกระทบเชิงกลยุทธ์ / ใหญ่', color: 'bg-purple-100 text-purple-800' }
];

const EFFORT_LEVELS = [
  { value: 'low', label: 'ต่ำ', description: 'ความพยายามน้อย' },
  { value: 'medium', label: 'ปานกลาง', description: 'ความพยายามปานกลาง' },
  { value: 'high', label: 'สูง', description: 'ความพยายามสูง' }
];

const ContributionForm: React.FC<ContributionFormProps> = ({
  user,
  onSubmit,
  onCancel,
  initialData,
  isEditing = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagsInput, setTagsInput] = useState('');


  const {
    control,
    handleSubmit,
    getValues,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<ContributionFormData>({
    defaultValues: {
      title: '',
      accountName: (user.involvedAccountNames && user.involvedAccountNames.length === 1) ? user.involvedAccountNames[0] : '',
      saleName: (user.involvedSaleNames && user.involvedSaleNames.length === 1) ? user.involvedSaleNames[0] : '',
      saleEmail: (user.involvedSaleEmails && user.involvedSaleEmails.length === 1) ? user.involvedSaleEmails[0] : '',
      contributionType: 'technical',
      impact: 'medium',
      effort: 'medium',
      estimatedImpactValue: 0,
      description: '',
      contributionMonth: '',
      tags: []
    },
    mode: 'onChange'
  });

  const watchedAccountName = watch('accountName');
  const watchedSaleName = watch('saleName');
  const watchedSaleEmail = watch('saleEmail');
  const watchedContributionType = watch('contributionType');

  // Auto-fill all fields when component mounts
  useEffect(() => {
    if (isEditing && initialData) {
      // Load existing data for editing
      setValue('title', initialData.title || '');
      setValue('accountName', initialData.accountName || '');
      setValue('saleName', initialData.saleName || '');
      setValue('saleEmail', initialData.saleEmail || '');
      setValue('contributionType', initialData.contributionType || '');
      setValue('impact', initialData.impact || 'medium');
      setValue('effort', initialData.effort || 'medium');
      setValue('estimatedImpactValue', initialData.estimatedImpactValue || 0);
      setValue('description', initialData.description || '');
      setValue('contributionMonth', initialData.contributionMonth || '');
      setValue('tags', initialData.tags || []);
      setTagsInput(initialData.tags ? initialData.tags.join(', ') : '');
    } else if (user && user.involvedAccountNames && user.involvedSaleNames && user.involvedSaleEmails) {
      // Auto-fill Account Name
      if (user.involvedAccountNames.length === 1) {
        setValue('accountName', user.involvedAccountNames[0]);
      }
      
      // Auto-fill Sale Name
      if (user.involvedSaleNames.length === 1) {
        setValue('saleName', user.involvedSaleNames[0]);
      }
      
      // Auto-fill Sale Email
      if (user.involvedSaleEmails.length === 1) {
        setValue('saleEmail', user.involvedSaleEmails[0]);
      }
    }
  }, [user, setValue, isEditing, initialData]);

  // Auto-fill Sale Email when Sale Name changes
  useEffect(() => {
    if (watchedSaleName && user.involvedSaleNames && user.involvedSaleNames.includes(watchedSaleName)) {
      const saleIndex = user.involvedSaleNames.indexOf(watchedSaleName);
      if (saleIndex !== -1 && user.involvedSaleEmails && user.involvedSaleEmails[saleIndex]) {
        setValue('saleEmail', user.involvedSaleEmails[saleIndex]);
      }
    }
  }, [watchedSaleName, user.involvedSaleNames, user.involvedSaleEmails, setValue]);

  const onFormSubmit = async (data: ContributionFormData, action: 'draft' | 'submit') => {
    setIsSubmitting(true);
    try {
      const parsedTags = (tagsInput || '')
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      // Ensure all required fields are present
      const submitData = {
        ...data,
        tags: parsedTags,
        estimatedImpactValue: data.estimatedImpactValue || 0,
        status: action === 'draft' ? 'draft' : 'submitted'
      };
      
      console.log('🔍 ContributionForm - onFormSubmit Debug:', {
        action: action,
        submitData: submitData,
        hasStatus: 'status' in submitData,
        statusValue: submitData.status
      });
      
      await onSubmit(submitData, action);
      toast.success(action === 'draft' ? 'บันทึก Draft สำเร็จ' : 'ส่ง Contribution สำเร็จ');
    } catch (error) {
      console.error('Form Submit Error:', error);
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          เพิ่ม Contribution ใหม่
        </h2>
        <p className="text-gray-600">
          กรอกข้อมูล Contribution ของคุณให้ครบถ้วน
        </p>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        {/* Basic Information Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
            ข้อมูลพื้นฐาน
          </h3>
          
          {/* Auto-fill Status */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Auto-fill Status:</strong> 
                  {user.involvedAccountNames && user.involvedSaleNames && user.involvedSaleEmails && 
                   user.involvedAccountNames.length === 1 && user.involvedSaleNames.length === 1 && user.involvedSaleEmails.length === 1 ? (
                    <span className="text-green-600 ml-1">✓ ข้อมูลทั้งหมดจะถูกกรอกอัตโนมัติ</span>
                  ) : (
                    <span className="text-orange-600 ml-1">⚠ กรุณาเลือกข้อมูลจากรายการที่มี ({user.involvedAccountNames?.length || 0} Account, {user.involvedSaleNames?.length || 0} Sale)</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Account Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name <span className="text-red-500">*</span>
              </label>
              {user.involvedAccountNames && user.involvedAccountNames.length === 1 ? (
                <div className="relative">
                  <input
                    type="text"
                    value={user.involvedAccountNames[0]}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 text-gray-700 font-medium"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-green-600 text-sm">✓ Auto-filled</span>
                  </div>
                </div>
              ) : (
                <Controller
                  name="accountName"
                  control={control}
                  rules={{ required: 'กรุณาเลือก Account Name' }}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">เลือก Account Name ({user.involvedAccountNames?.length || 0} รายการ)</option>
                      {user.involvedAccountNames?.map((account) => (
                        <option key={account} value={account}>
                          {account}
                        </option>
                      ))}
                    </select>
                  )}
                />
              )}
              {errors.accountName && (
                <p className="mt-1 text-sm text-red-600">{errors.accountName.message}</p>
              )}
            </div>

            {/* Sale Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sale Name <span className="text-red-500">*</span>
              </label>
              {user.involvedSaleNames && user.involvedSaleNames.length === 1 ? (
                <div className="relative">
                  <input
                    type="text"
                    value={user.involvedSaleNames[0]}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 text-gray-700 font-medium"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-green-600 text-sm">✓ Auto-filled</span>
                  </div>
                </div>
              ) : (
                <Controller
                  name="saleName"
                  control={control}
                  rules={{ required: 'กรุณาเลือก Sale Name' }}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">เลือก Sale Name ({user.involvedSaleNames?.length || 0} รายการ)</option>
                      {user.involvedSaleNames?.map((sale, index) => (
                        <option key={sale} value={sale}>
                          {sale} {user.involvedSaleEmails[index] && `(${user.involvedSaleEmails[index]})`}
                        </option>
                      ))}
                    </select>
                  )}
                />
              )}
              {errors.saleName && (
                <p className="mt-1 text-sm text-red-600">{errors.saleName.message}</p>
              )}
            </div>

            {/* Sale Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sale Email <span className="text-red-500">*</span>
              </label>
              {user.involvedSaleEmails && user.involvedSaleEmails.length === 1 ? (
                <div className="relative">
                  <input
                    type="email"
                    value={user.involvedSaleEmails[0]}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 text-gray-700 font-medium"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-green-600 text-sm">✓ Auto-filled</span>
                  </div>
                </div>
              ) : (
                <Controller
                  name="saleEmail"
                  control={control}
                  rules={{
                    required: 'กรุณาเลือก Sale Email',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'รูปแบบอีเมลไม่ถูกต้อง'
                    }
                  }}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">เลือก Sale Email ({user.involvedSaleEmails?.length || 0} รายการ)</option>
                      {user.involvedSaleEmails?.map((email, index) => (
                        <option key={email} value={email}>
                          {email} {user.involvedSaleNames[index] && `(${user.involvedSaleNames[index]})`}
                        </option>
                      ))}
                    </select>
                  )}
                />
              )}
              {errors.saleEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.saleEmail.message}</p>
              )}
            </div>

            {/* Contribution Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contribution Type <span className="text-red-500">*</span>
              </label>
              <Controller
                name="contributionType"
                control={control}
                rules={{ required: 'กรุณาเลือก Contribution Type' }}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">เลือก Contribution Type</option>
                    {CONTRIBUTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.contributionType && (
                <p className="mt-1 text-sm text-red-600">{errors.contributionType.message}</p>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <Controller
              name="title"
              control={control}
              rules={{ 
                required: 'กรุณากรอก Title',
                minLength: { value: 5, message: 'Title ต้องมีอย่างน้อย 5 ตัวอักษร' }
              }}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="กรอก Title ของ Contribution"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <Controller
              name="description"
              control={control}
              rules={{ 
                required: 'กรุณากรอก Description',
                minLength: { value: 20, message: 'Description ต้องมีอย่างน้อย 20 ตัวอักษร' }
              }}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={4}
                  placeholder="อธิบายรายละเอียดของ Contribution..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Impact and Effort Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-purple-600" />
            ระดับผลกระทบและความพยายาม
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Impact Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Impact Level <span className="text-red-500">*</span>
              </label>
              <Controller
                name="impact"
                control={control}
                rules={{ required: 'กรุณาเลือกระดับผลกระทบ' }}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">เลือกระดับผลกระทบ</option>
                    {IMPACT_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label} - {level.description}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.impact && (
                <p className="mt-1 text-sm text-red-600">{errors.impact.message}</p>
              )}
            </div>

            {/* Effort Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Effort Level <span className="text-red-500">*</span>
              </label>
              <Controller
                name="effort"
                control={control}
                rules={{ required: 'กรุณาเลือกระดับความพยายาม' }}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">เลือกระดับความพยายาม</option>
                    {EFFORT_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label} - {level.description}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.effort && (
                <p className="mt-1 text-sm text-red-600">{errors.effort.message}</p>
              )}
            </div>

            {/* Contribution Month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contribution Month <span className="text-red-500">*</span>
              </label>
              <Controller
                name="contributionMonth"
                control={control}
                rules={{ required: 'กรุณาเลือกเดือนที่ทำ Contribution' }}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">เลือกเดือน/ปี</option>
                    <option value="2025-01">มกราคม 2025</option>
                    <option value="2025-02">กุมภาพันธ์ 2025</option>
                    <option value="2025-03">มีนาคม 2025</option>
                    <option value="2025-04">เมษายน 2025</option>
                    <option value="2025-05">พฤษภาคม 2025</option>
                    <option value="2025-06">มิถุนายน 2025</option>
                    <option value="2025-07">กรกฎาคม 2025</option>
                    <option value="2025-08">สิงหาคม 2025</option>
                    <option value="2025-09">กันยายน 2025</option>
                    <option value="2025-10">ตุลาคม 2025</option>
                    <option value="2025-11">พฤศจิกายน 2025</option>
                    <option value="2025-12">ธันวาคม 2025</option>
                  </select>
                )}
              />
              {errors.contributionMonth && (
                <p className="mt-1 text-sm text-red-600">{errors.contributionMonth.message}</p>
              )}
            </div>
          </div>

          {/* Estimated Impact Value - Only show for Business contributions */}
          {watchedContributionType === 'business' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Business Impact Value (THB) <span className="text-red-500">*</span>
              </label>
              <Controller
                name="estimatedImpactValue"
                control={control}
                rules={{ 
                  required: 'กรุณากรอกมูลค่าผลกระทบที่คาดการณ์',
                  min: { value: 0, message: 'มูลค่าต้องมากกว่าหรือเท่ากับ 0' }
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="กรอกมูลค่าในบาท"
                  />
                )}
              />
              {errors.estimatedImpactValue && (
                <p className="mt-1 text-sm text-red-600">{errors.estimatedImpactValue.message}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                กรอกมูลค่าที่คาดว่าจะได้รับจาก Contribution นี้ (บาท)
              </p>
            </div>
          )}
        </div>

        {/* Tags Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Tags
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (คั่นด้วยจุลภาค)
            </label>
            <input
              type="text"
              placeholder="เช่น technical, architecture, cloud, database"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">
              ใส่ tags คั่นด้วยจุลภาค เช่น technical, architecture, cloud
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit((data) => onFormSubmit(data, 'draft'))}
            disabled={isSubmitting || !isValid}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={handleSubmit((data) => onFormSubmit(data, 'submit'))}
            disabled={isSubmitting || !isValid}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'กำลังส่ง...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContributionForm;