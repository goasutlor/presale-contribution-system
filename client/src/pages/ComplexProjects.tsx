import React, { useEffect, useMemo, useState } from 'react';
import { RocketLaunchIcon, CheckBadgeIcon, XMarkIcon, PlusIcon, ClipboardDocumentListIcon, TrashIcon } from '@heroicons/react/24/outline';
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
  status: 'win' | 'loss';
  keySuccessFactors?: string;
  reasonsForLoss?: string;
  lessonsLearned: string;
  suggestionsForImprovement: string;
  createdAt: string;
  updatedAt: string;
}

const defaultForm = {
  projectName: '',
  description: '',
  salesName: '',
  accountName: '',
  status: 'win' as 'win' | 'loss',
  keySuccessFactors: '',
  reasonsForLoss: '',
  lessonsLearned: '',
  suggestionsForImprovement: '',
};

const ComplexProjects: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ComplexProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const accountOptions = useMemo(() => user?.involvedAccountNames || [], [user]);
  const salesOptions = useMemo(() => user?.involvedSaleNames || [], [user]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await apiService.getComplexProjects();
        if (res.success) setItems(res.data);
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
    setForm(defaultForm);
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
      keySuccessFactors: form.status === 'win' ? form.keySuccessFactors : '',
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

      salesName: project.salesName,
      accountName: project.accountName,
      status: project.status,
      keySuccessFactors: project.keySuccessFactors || '',
      reasonsForLoss: project.reasonsForLoss || '',
      lessonsLearned: project.lessonsLearned,
      suggestionsForImprovement: project.suggestionsForImprovement,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <RocketLaunchIcon className="h-7 w-7 text-primary-600" />
            Complex, Big, or Challenging Projects 2025
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            เมนูแยกสำหรับกรอกข้อมูลโครงการขนาดใหญ่หรือท้าทาย ประจำปี 2025
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

            <div>
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
                {(['win', 'loss'] as const).map((status) => (
                  <label key={status} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      checked={form.status === status}
                      onChange={() => setForm({ ...form, status })}
                    />
                    <span className="capitalize text-gray-800 dark:text-gray-200">{status}</span>
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
          <span className="text-sm text-gray-500 dark:text-gray-400">{items.length} รายการ</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">กำลังโหลด...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">ยังไม่มีข้อมูล</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {items.map((project) => (
              <div key={project.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{project.projectName}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        project.status === 'win'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <CheckBadgeIcon className="h-4 w-4 mr-1" />
                        {project.status === 'win' ? 'Win' : 'Loss'}
                      </span>
                      {project.userName && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">Owner: {project.userName}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Account: {project.accountName} • Sales: {project.salesName}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-200 mt-2">
                      {project.description}
                    </p>

                    {project.status === 'win' && project.keySuccessFactors && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Key Success Factors</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{project.keySuccessFactors}</p>
                      </div>
                    )}

                    {project.status === 'loss' && project.reasonsForLoss && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Reasons for Loss</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{project.reasonsForLoss}</p>
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Lessons Learned</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{project.lessonsLearned}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Suggestions for Improvement</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{project.suggestionsForImprovement}</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                      อัปเดตล่าสุด: {new Date(project.updatedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {(project.userId === user?.id || user?.role === 'admin') && (
                      <button
                        onClick={() => startEdit(project)}
                        className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                      >
                        แก้ไข
                      </button>
                    )}
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium inline-flex items-center gap-1"
                      >
                        <TrashIcon className="h-4 w-4" />
                        ลบ
                      </button>
                    )}
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

