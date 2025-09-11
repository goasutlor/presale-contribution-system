import React from 'react';
import { XMarkIcon, CalendarIcon, UserIcon, BuildingOfficeIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Contribution {
  id: string;
  title: string;
  accountName: string;
  saleName: string;
  saleEmail: string;
  contributionType: string;
  impact: string;
  effort: string;
  estimatedImpactValue?: number;
  description: string;
  contributionMonth: string;
  tags: string[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface ContributionModalProps {
  contribution: Contribution | null;
  isOpen: boolean;
  onClose: () => void;
}

const getContributionTypeLabel = (type: string) => {
  const typeMap: { [key: string]: string } = {
    'solution_architecture': 'Solution Architecture Design',
    'technical_consultation': 'Technical Consultation',
    'proof_of_concept': 'Proof of Concept',
    'requirement_analysis': 'Requirement Analysis',
    'vendor_evaluation': 'Vendor Evaluation',
    'cost_optimization': 'Cost Optimization',
    'performance_improvement': 'Performance Improvement',
    'security_assessment': 'Security Assessment',
    'compliance_review': 'Compliance Review',
    'training_workshop': 'Training & Workshop',
    'project_management': 'Project Management',
    'other': 'อื่นๆ'
  };
  return typeMap[type] || type;
};

const getImpactLevelBadge = (level: string) => {
  const levelMap: { [key: string]: { label: string; color: string } } = {
    'low': { label: 'ต่ำ', color: 'bg-gray-100 text-gray-800' },
    'medium': { label: 'ปานกลาง', color: 'bg-yellow-100 text-yellow-800' },
    'high': { label: 'สูง', color: 'bg-orange-100 text-orange-800' },
    'critical': { label: 'วิกฤต', color: 'bg-red-100 text-red-800' }
  };
  const config = levelMap[level] || { label: level, color: 'bg-gray-100 text-gray-800' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

const getStatusBadge = (status: string) => {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      <ClockIcon className="h-4 w-4" />
      <span className="ml-1">บันทึกแล้ว</span>
    </span>
  );
};

const getBusinessValueLabel = (value: string) => {
  const valueMap: { [key: string]: string } = {
    'cost_reduction': 'ลดต้นทุน',
    'revenue_increase': 'เพิ่มรายได้',
    'efficiency_improvement': 'ปรับปรุงประสิทธิภาพ',
    'risk_mitigation': 'ลดความเสี่ยง',
    'customer_satisfaction': 'ความพึงพอใจลูกค้า',
    'competitive_advantage': 'ความได้เปรียบทางการแข่งขัน',
    'compliance_achievement': 'การปฏิบัติตามกฎระเบียบ',
    'innovation': 'นวัตกรรม'
  };
  return valueMap[value] || value;
};

const getTechnicalComplexityLabel = (complexity: string) => {
  const complexityMap: { [key: string]: string } = {
    'simple': 'ง่าย',
    'moderate': 'ปานกลาง',
    'complex': 'ซับซ้อน',
    'very_complex': 'ซับซ้อนมาก'
  };
  return complexityMap[complexity] || complexity;
};

export default function ContributionModal({ contribution, isOpen, onClose }: ContributionModalProps) {
  if (!isOpen || !contribution) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-0 mx-auto p-5 w-full max-w-6xl">
        <div className="relative bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 line-clamp-2">
                  {contribution.title}
                </h2>
                <div className="mt-2 flex items-center space-x-3">
                  {getImpactLevelBadge(contribution.impact)}
                  {getStatusBadge(contribution.status)}
                </div>
              </div>
              <button
                onClick={onClose}
                className="ml-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  ข้อมูลพื้นฐาน
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Account</dt>
                      <dd className="text-sm text-gray-900">{contribution.accountName}</dd>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <UserIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Sale</dt>
                      <dd className="text-sm text-gray-900">{contribution.saleName}</dd>
                      <dd className="text-sm text-gray-600">{contribution.saleEmail}</dd>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">ประเภท Contribution</dt>
                      <dd className="text-sm text-gray-900">{getContributionTypeLabel(contribution.contributionType)}</dd>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  ระยะเวลาและความพยายาม
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">เดือนที่ทำ</dt>
                      <dd className="text-sm text-gray-900">
                        {contribution.contributionMonth ? 
                          new Date(contribution.contributionMonth + '-01').toLocaleDateString('th-TH', { 
                            year: 'numeric', 
                            month: 'long' 
                          }) : 
                          '-'
                        }
                      </dd>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">ระดับความพยายาม</dt>
                      <dd className="text-sm text-gray-900">{contribution.effort}</dd>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">เดือนที่ทำ</dt>
                      <dd className="text-sm text-gray-900">
                        {contribution.contributionMonth ? 
                          new Date(contribution.contributionMonth + '-01').toLocaleDateString('th-TH', { 
                            year: 'numeric', 
                            month: 'long' 
                          }) : 
                          '-'
                        }
                      </dd>
                    </div>
                  </div>

                  {contribution.estimatedImpactValue && (
                    <div className="flex items-start">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <dt className="text-sm font-medium text-gray-500">มูลค่าผลกระทบที่คาดการณ์</dt>
                        <dd className="text-sm text-gray-900">฿{contribution.estimatedImpactValue.toLocaleString()}</dd>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                รายละเอียด
              </h3>
              <p className="text-gray-700 leading-relaxed">{contribution.description}</p>
            </div>

            {/* Business Impact */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  ผลกระทบทางธุรกิจ
                </h3>
                
                <div className="space-y-3">
                  {contribution.estimatedImpactValue && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">มูลค่าผลกระทบที่คาดการณ์</dt>
                      <dd className="text-sm text-gray-900">฿{contribution.estimatedImpactValue.toLocaleString()}</dd>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  สถานะและข้อมูล
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">สถานะ</dt>
                    <dd className="mt-1">{getStatusBadge(contribution.status)}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ระดับผลกระทบ</dt>
                    <dd className="mt-1">{getImpactLevelBadge(contribution.impact)}</dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {contribution.tags && contribution.tags.length > 0 && (
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {contribution.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between text-sm text-gray-500 space-y-2 sm:space-y-0">
                <span>
                  สร้างเมื่อ: {new Date(contribution.createdAt).toLocaleString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <span>
                  อัปเดตล่าสุด: {new Date(contribution.updatedAt).toLocaleString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
