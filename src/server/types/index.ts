export interface User {
  id: string;
  fullName: string;
  staffId: string;
  email: string;
  password: string;
  involvedAccountNames: string[];
  involvedSaleNames: string[];
  involvedSaleEmails: string[];
  blogLinks: string[];
  role: 'user' | 'admin';
  canViewOthers: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contribution {
  id: string;
  userId: string;
  accountName: string;
  saleName: string;
  saleEmail: string;
  contributionType: 'technical' | 'business' | 'relationship' | 'innovation' | 'other';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  estimatedImpactValue?: number; // New field for business impact value
  contributionMonth: string; // Changed from startDate/endDate to single month field
  status: 'draft' | 'submitted' | 'approved' | 'rejected'; // Updated status field
  attachments?: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplexProject {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  accountName?: string;
  saleName?: string;
  contributionType?: string;
  impact?: string;
  status?: string;
}

export interface ReportData {
  totalContributions: number;
  totalUsers: number;
  totalAccounts: number;
  contributionsByType: Record<string, number>;
  contributionsByImpact: Record<string, number>;
  contributionsByStatus: Record<string, number>;
  topContributors: Array<{ userId: string; fullName: string; count: number }>;
  topAccounts: Array<{ accountName: string; count: number }>;
  monthlyTrends: Array<{ month: string; count: number }>;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'password'>;
}

export interface CreateUserRequest {
  fullName: string;
  staffId: string;
  email: string;
  password: string;
  involvedAccountNames: string[];
  involvedSaleNames: string[];
  involvedSaleEmails: string[];
  blogLinks: string[];
  role: 'user' | 'admin';
  canViewOthers: boolean;
}

export interface UpdateUserRequest {
  fullName?: string;
  staffId?: string;
  involvedAccountNames?: string[];
  involvedSaleNames?: string[];
  involvedSaleEmails?: string[];
  blogLinks?: string[];
  role?: 'user' | 'admin';
  canViewOthers?: boolean;
}

export interface CreateContributionRequest {
  accountName: string;
  saleName: string;
  saleEmail: string;
  contributionType: 'technical' | 'business' | 'relationship' | 'innovation' | 'other';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  estimatedImpactValue?: number; // New field for business impact value
  contributionMonth: string; // Changed from startDate/endDate to single month field
  status?: 'draft' | 'submitted' | 'approved' | 'rejected'; // Added status field
  tags: string[];
}

export interface UpdateContributionRequest {
  accountName?: string;
  saleName?: string;
  saleEmail?: string;
  contributionType?: 'technical' | 'business' | 'relationship' | 'innovation' | 'other';
  title?: string;
  description?: string;
  impact?: 'low' | 'medium' | 'high' | 'critical';
  effort?: 'low' | 'medium' | 'high';
  estimatedImpactValue?: number; // New field for business impact value
  contributionMonth?: string; // Changed from startDate/endDate to single month field
  status?: 'draft' | 'submitted' | 'approved' | 'rejected'; // Updated status field
  tags?: string[];
}

export interface CreateComplexProjectRequest {
  projectName: string;
  description: string;
  salesName: string;
  accountName: string;
  status: 'win' | 'loss' | 'ongoing';
  keySuccessFactors?: string;
  reasonsForLoss?: string;
  lessonsLearned: string;
  suggestionsForImprovement: string;
}

export interface UpdateComplexProjectRequest {
  projectName?: string;
  description?: string;
  salesName?: string;
  accountName?: string;
  status?: 'win' | 'loss' | 'ongoing';
  keySuccessFactors?: string;
  reasonsForLoss?: string;
  lessonsLearned?: string;
  suggestionsForImprovement?: string;
}

export interface FunctionalTestResult {
  testName: string;
  status: 'pass' | 'fail';
  message: string;
  details?: any;
  timestamp: Date;
}

export interface FunctionalTestResponse {
  overallStatus: 'pass' | 'fail';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: FunctionalTestResult[];
  timestamp: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
