import React, { useEffect, useMemo, useState } from 'react';
import { RocketLaunchIcon, CheckBadgeIcon, XMarkIcon, PlusIcon, ClipboardDocumentListIcon, TrashIcon, UserIcon, BuildingOfficeIcon, UserGroupIcon, BookOpenIcon, LightBulbIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';

interface ComplexProject {
  id: string;
  userId: string;
  userName?: string;
  projectName: string;
  description: string;
  salesName: string;
  accountName: string;
  status: 'win' | 'loss' | 'ongoing';
  keySuccessFactors?: string;
  reasonsForLoss?: string;
  lessonsLearned: string;
  suggestionsForImprovement: string;
  year: number;
  createdAt: string;
  updatedAt: string;
}

type ComplexProjectForm = {
  projectName: string;
  description: string;
  salesName: string;
  accountName: string;
  status: 'win' | 'loss' | 'ongoing';
  keySuccessFactors: string;
  reasonsForLoss: string;
  lessonsLearned: string;
  suggestionsForImprovement: string;
  year: number;
};

const defaultForm: ComplexProjectForm = {
  projectName: '',
  description: '',
  salesName: '',
  accountName: '',
  status: 'win',
  keySuccessFactors: '',
  reasonsForLoss: '',
  lessonsLearned: '',
  suggestionsForImprovement: '',
  year: new Date().getFullYear(),
};

const ComplexProjects: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ComplexProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ComplexProjectForm>(defaultForm);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const accountOptions = useMemo(() => user?.involvedAccountNames || [], [user]);
  const salesOptions = useMemo(() => user?.involvedSaleNames || [], [user]);

  // Get available years from items
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    items.forEach(item => {
      if (item.year) {
        years.add(item.year);
      } else {
        // Fallback: extract year from createdAt if year field doesn't exist
        const year = new Date(item.createdAt).getFullYear();
        years.add(year);
      }
    });
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    // If no years found, add current year and previous year
    if (sortedYears.length === 0) {
      const currentYear = new Date().getFullYear();
      return [currentYear, currentYear - 1];
    }
    return sortedYears;
  }, [items]);

  // Filter items by selected year
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (item.year) {
        return item.year === selectedYear;
      }
      // Fallback: use createdAt year
      return new Date(item.createdAt).getFullYear() === selectedYear;
    });
  }, [items, selectedYear]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await apiService.getComplexProjects();
        if (res.success) setItems(res.data || []);
        else toast.error(res.message || 'โหลดข้อมูลไม่สำเร็จ');
      } catch (err: any) {
        toast.error(err.message || 'โหลดข้อมูลไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    // Auto prefill account/sales when there is only one option
    setForm((prev) => ({
      ...prev,
      accountName: accountOptions.length === 1 ? accountOptions[0] : prev.accountName,
      salesName: salesOptions.length === 1 ? salesOptions[0] : prev.salesName,
    }));
  }, [accountOptions, salesOptions]);

  const resetForm = () => {
    setForm({ ...defaultForm, year: selectedYear });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.projectName.trim()) return toast.error('กรุณากรอก Project Name');
    if (!form.description.trim()) return toast.error('กรุณากรอกรายละเอียดโครงการ');
    if (!form.salesName.trim()) return toast.error('กรุณาเลือก Sales Name');
    if (!form.accountName.trim()) return toast.error('กรุณาเลือก Account Name');
    if (!form.lessonsLearned.trim()) return toast.error('กรุณากรอก Lessons Learned');
    if (!form.suggestionsForImprovement.trim()) return toast.error('กรุณากรอก Suggestions for Improvement');
    if (form.status === 'win' && !form.keySuccessFactors.trim()) return toast.error('กรุณากรอก Key Success Factors เมื่อสถานะ Win');
    if (form.status === 'loss' && !form.reasonsForLoss.trim()) return toast.error('กรุณากรอก Reasons for Loss เมื่อสถานะ Loss');

    const payload = {
      ...form,
      year: form.year || selectedYear,
      keySuccessFactors: form.status === 'win' || form.status === 'ongoing' ? form.keySuccessFactors : '',
      reasonsForLoss: form.status === 'loss' ? form.reasonsForLoss : '',
    };

    try {
      setSaving(true);
      if (editingId) {
        await apiService.updateComplexProject(editingId, payload);
        toast.success('อัปเดตข้อมูลเรียบร้อย');
      } else {
        await apiService.createComplexProject(payload);
        toast.success('บันทึกข้อมูลเรียบร้อย');
      }
      const refreshed = await apiService.getComplexProjects();
      if (refreshed.success) setItems(refreshed.data);
      resetForm();
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (project: ComplexProject) => {
    setEditingId(project.id);
    setForm({
      projectName: project.projectName,
      description: project.description,
      salesName: project.salesName,
      accountName: project.accountName,
      status: project.status,
      keySuccessFactors: project.keySuccessFactors || '',
      reasonsForLoss: project.reasonsForLoss || '',
      lessonsLearned: project.lessonsLearned,
      suggestionsForImprovement: project.suggestionsForImprovement,
      year: project.year || new Date(project.createdAt).getFullYear(),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('ยืนยันลบโครงการนี้?')) return;
    try {
      await apiService.deleteComplexProject(id);
      toast.success('ลบข้อมูลเรียบร้อย');
      const refreshed = await apiService.getComplexProjects();
      if (refreshed.success) setItems(refreshed.data);
    } catch (err: any) {
      toast.error(err.message || 'ลบข้อมูลไม่สำเร็จ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <RocketLaunchIcon className="h-7 w-7 text-primary-600" />
            Complex, Big, or Challenging Projects
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            เมนูแยกสำหรับกรอกข้อมูลโครงการขนาดใหญ่หรือท้าทาย
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 shadow-sm"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          เพิ่มบันทึกใหม่
        </button>
      </div>

      {/* Year Selector */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-soft p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">เลือกปี:</span>
          {availableYears.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedYear === year
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {year}
            </button>
          ))}
          {/* Add button to add new year */}
          <button
            onClick={() => {
              const newYear = new Date().getFullYear();
              if (!availableYears.includes(newYear)) {
                setSelectedYear(newYear);
              }
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
          >
            <PlusIcon className="h-4 w-4" />
            เพิ่มปีใหม่
          </button>
        </div>
      </div>

      {/* Form drawer */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-soft p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingId ? 'แก้ไขโครงการ' : 'เพิ่มโครงการใหม่'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                กรอกข้อมูลสำคัญของโครงการ และระบุบทเรียนหลังจบงาน
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Year <span className="text-red-500">*</span>
              </label>
              <select
                value={form.year}
                onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i + 1).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.projectName}
                onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="ชื่อโครงการ"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Project Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="อธิบายภาพรวมโครงการว่าเกี่ยวกับอะไร ทำอะไรให้ลูกค้า"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Sales Name <span className="text-red-500">*</span>
              </label>
              <select
                value={form.salesName}
                onChange={(e) => setForm({ ...form, salesName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="">เลือก Sales Name</option>
                {salesOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Account Name <span className="text-red-500">*</span>
              </label>
              <select
                value={form.accountName}
                onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="">เลือก Account Name</option>
                {accountOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Project Status <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                {(['win', 'loss', 'ongoing'] as const).map((status) => (
                  <label key={status} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      checked={form.status === status}
                      onChange={() => setForm({ ...form, status })}
                    />
                    <span className="capitalize text-gray-800 dark:text-gray-200">
                      {status === 'ongoing' ? 'Ongoing' : status}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {form.status === 'win' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Key Success Factors (How We Won) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={form.keySuccessFactors}
                  onChange={(e) => setForm({ ...form, keySuccessFactors: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="กลยุทธ์ / Solution / ความสัมพันธ์ / ราคา / Timing ฯลฯ"
                />
              </div>
            )}

            {form.status === 'loss' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Reasons for Loss (Why We Lost) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={form.reasonsForLoss}
                  onChange={(e) => setForm({ ...form, reasonsForLoss: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="ราคา / Solution ไม่ตรง / Competitor Advantage / Timing / Requirement Change ฯลฯ"
                />
              </div>
            )}
            
            {form.status === 'ongoing' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Current Progress & Status
                </label>
                <textarea
                  rows={3}
                  value={form.keySuccessFactors}
                  onChange={(e) => setForm({ ...form, keySuccessFactors: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="อธิบายสถานะปัจจุบันของโครงการ ความคืบหน้า และสิ่งที่กำลังดำเนินการ"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Lessons Learned <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={form.lessonsLearned}
                onChange={(e) => setForm({ ...form, lessonsLearned: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="สิ่งที่ทีมได้เรียนรู้ ทั้งด้านเทคนิค กระบวนการ การทำงานร่วมกัน"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Suggestions for Improvement <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={form.suggestionsForImprovement}
                onChange={(e) => setForm({ ...form, suggestionsForImprovement: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="ปรับปรุง Presales / Engagement / Internal Process / Skill Gap ฯลฯ"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'กำลังบันทึก...' : editingId ? 'อัปเดตข้อมูล' : 'บันทึก'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-soft">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100 font-semibold">
            <ClipboardDocumentListIcon className="h-5 w-5" />
            รายการโครงการ
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{filteredItems.length} รายการ (ปี {selectedYear})</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">กำลังโหลด...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">ยังไม่มีข้อมูลสำหรับปี {selectedYear}</div>
        ) : (
          <div className="space-y-6">
            {filteredItems.map((project) => (
              <div 
                key={project.id} 
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Header Section */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                          {project.projectName}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
                          project.status === 'win'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : project.status === 'loss'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          <CheckBadgeIcon className="h-3.5 w-3.5 mr-1.5" />
                          {project.status === 'win' ? 'Win' : project.status === 'loss' ? 'Loss' : 'Ongoing'}
                        </span>
                      </div>
                      
                      {/* Meta Information */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {project.userName && (
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{project.userName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                          <span>{project.accountName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <UserGroupIcon className="h-4 w-4 text-gray-400" />
                          <span>{project.salesName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-auto">
                          <ClockIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-xs">{new Date(project.updatedAt).toLocaleDateString('th-TH', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(project.userId === user?.id || user?.role === 'admin') && (
                        <button
                          onClick={() => startEdit(project)}
                          className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        >
                          แก้ไข
                        </button>
                      )}
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors inline-flex items-center gap-1.5"
                        >
                          <TrashIcon className="h-4 w-4" />
                          ลบ
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="px-6 py-5 space-y-5">
                  {/* Project Description */}
                  <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 rounded-r-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <RocketLaunchIcon className="h-4 w-4 text-blue-600" />
                      Project Description
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                      {project.description}
                    </p>
                  </div>

                  {/* Status-Specific Information */}
                  {project.status === 'win' && project.keySuccessFactors && (
                    <div className="bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500 rounded-r-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <CheckBadgeIcon className="h-4 w-4 text-green-600" />
                        Key Success Factors
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {project.keySuccessFactors}
                      </p>
                    </div>
                  )}

                  {project.status === 'loss' && project.reasonsForLoss && (
                    <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded-r-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <XMarkIcon className="h-4 w-4 text-red-600" />
                        Reasons for Loss
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {project.reasonsForLoss}
                      </p>
                    </div>
                  )}

                  {project.status === 'ongoing' && project.keySuccessFactors && (
                    <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 rounded-r-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-blue-600" />
                        Current Progress & Status
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {project.keySuccessFactors}
                      </p>
                    </div>
                  )}

                  {/* Lessons & Suggestions Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <BookOpenIcon className="h-4 w-4 text-amber-600" />
                        Lessons Learned
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {project.lessonsLearned}
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <LightBulbIcon className="h-4 w-4 text-purple-600" />
                        Suggestions for Improvement
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {project.suggestionsForImprovement}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplexProjects;

