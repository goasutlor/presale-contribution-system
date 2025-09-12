import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { dbQueryOne, dbExecute } from '../database/init';
import { generateToken, authenticateToken, requireAdmin, requireUser } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Safe JSON parse for array-like fields stored as TEXT
const parseJsonArraySafe = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

// Login validation
const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 1 }).withMessage('Password is required')
];

// Function to clean special characters
const cleanSpecialCharacters = (text: string): string => {
  return text
    .replace(/[\u0E47-\u0E4E]/g, '') // Remove Thai diacritical marks
    .replace(/[\u0E30-\u0E39]/g, '') // Remove Thai vowels
    .replace(/[\u0E40-\u0E44]/g, '') // Remove Thai consonants
    .replace(/[^\u0020-\u007E\u0E01-\u0E5B]/g, '') // Keep only ASCII and Thai characters
    .trim();
};

// Signup validation
const signupValidation = [
  body('fullName')
    .isLength({ min: 1 }).withMessage('Full name is required')
    .custom((value) => {
      const cleaned = cleanSpecialCharacters(value);
      if (cleaned !== value) {
        throw new Error('Full name contains invalid characters');
      }
      return true;
    }),
  body('staffId')
    .isLength({ min: 1 }).withMessage('Staff ID is required')
    .custom((value) => {
      const cleaned = cleanSpecialCharacters(value);
      if (cleaned !== value) {
        throw new Error('Staff ID contains invalid characters');
      }
      return true;
    }),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  })
];

// Login route
router.post('/login', loginValidation, asyncHandler(async (req: Request, res: Response): Promise<any> => {
  try {
    console.log('🔍 Login attempt:', { email: req.body.email, passwordLength: req.body.password?.length });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed'
      });
    }

    const { email, password } = req.body;
    console.log('📧 Looking for user with email:', email);

    const user: any = await dbQueryOne('SELECT * FROM users WHERE email = ?', [email]);

    console.log('👤 User found:', user ? { id: user.id, email: user.email, role: user.role } : 'No user found');

    if (!user) {
      console.log('❌ No user found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    try {
      console.log('🔐 Comparing password...');
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('🔐 Password valid:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('❌ Invalid password for user:', email);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check account status
      if (user.status === 'pending') {
        console.log('❌ Account pending approval for user:', email);
        return res.status(403).json({
          success: false,
          message: 'Account pending approval'
        });
      }

      if (user.status === 'rejected') {
        console.log('❌ Account rejected for user:', email);
        return res.status(403).json({
          success: false,
          message: 'Account rejected'
        });
      }

      // Generate JWT token
      const token = generateToken(user.id);

      // Parse JSON fields for response
      const userResponse = {
        id: user.id,
        fullName: user.fullName,
        staffId: user.staffId,
        email: user.email,
        involvedAccountNames: parseJsonArraySafe(user.involvedAccountNames),
        involvedSaleNames: parseJsonArraySafe(user.involvedSaleNames),
        involvedSaleEmails: parseJsonArraySafe(user.involvedSaleEmails),
        role: user.role,
        status: user.status || 'approved',
        canViewOthers: Boolean(user.canViewOthers),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: userResponse
        }
      });
    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
}));

// Signup route
router.post('/signup', signupValidation, asyncHandler(async (req: Request, res: Response): Promise<any> => {
  try {
    console.log('🔍 Signup attempt:', { 
      fullName: req.body.fullName, 
      staffId: req.body.staffId, 
      email: req.body.email,
      accountsCount: req.body.involvedAccountNames?.length || 0,
      salesCount: req.body.involvedSaleNames?.length || 0
    });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      fullName, 
      staffId, 
      email, 
      password, 
      involvedAccountNames = [], 
      involvedSaleNames = [], 
      involvedSaleEmails = [] 
    } = req.body;

    // Clean special characters from input data
    const cleanedFullName = cleanSpecialCharacters(fullName);
    const cleanedStaffId = cleanSpecialCharacters(staffId);
    const cleanedAccountNames = involvedAccountNames.map((name: string) => cleanSpecialCharacters(name));
    const cleanedSaleNames = involvedSaleNames.map((name: string) => cleanSpecialCharacters(name));

    // Check if user already exists
    const existingUser: any = await dbQueryOne(
      'SELECT id FROM users WHERE email = ? OR staffId = ?',
      [email, staffId]
    );

    if (existingUser) {
      console.log('❌ User already exists:', { email, staffId });
      return res.status(400).json({
        success: false,
        message: 'User with this email or staff ID already exists'
      });
    }

    try {
          // Hash password
          const hashedPassword = await bcrypt.hash(password, 12);

          // Generate UUID for user ID
          const userId = uuidv4();
          console.log('🔍 Generated user ID:', userId);

          // Insert new user with pending status
          const insertQuery = `
            INSERT INTO users (
              id, fullName, staffId, email, password, 
              involvedAccountNames, involvedSaleNames, involvedSaleEmails,
              role, status, canViewOthers, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `;

          console.log('🔍 About to insert user with ID:', userId);
          console.log('🔍 Insert query:', insertQuery);
          console.log('🔍 Insert values:', [
            userId,
            cleanedFullName,
            cleanedStaffId,
            email,
            '[HASHED_PASSWORD]',
            JSON.stringify(cleanedAccountNames),
            JSON.stringify(cleanedSaleNames),
            JSON.stringify(involvedSaleEmails),
            'user',
            'pending',
            false
          ]);

          await dbExecute(
            insertQuery,
            [
              userId,
              cleanedFullName,
              cleanedStaffId,
              email,
              hashedPassword,
              JSON.stringify(cleanedAccountNames),
              JSON.stringify(cleanedSaleNames),
              JSON.stringify(involvedSaleEmails),
              'user',
              'pending',
              false
            ]
          );

          console.log('✅ User created successfully:', { 
            id: userId, 
            fullName: cleanedFullName, 
            email, 
            status: 'pending'
          });

          return res.status(201).json({
            success: true,
            message: 'User registered successfully. Please wait for admin approval.',
            data: {
              id: userId,
              fullName: cleanedFullName,
              staffId: cleanedStaffId,
              email,
              status: 'pending'
            }
          });
        } catch (error) {
          console.error('Error during signup:', error);
          return res.status(500).json({
            success: false,
            message: 'Signup failed'
          });
        }
    
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Signup failed'
    });
  }
}));

// Logout route (client-side token removal)
router.post('/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Get current user profile
router.get('/profile', authenticateToken, asyncHandler(async (req: Request, res: Response): Promise<any> => {
  try {
    // This will be protected by auth middleware
    const user = (req as any).user;
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('🔍 Profile Route - Raw User Data:', {
      id: user.id,
      email: user.email,
      involvedAccountNames: user.involvedAccountNames,
      involvedSaleNames: user.involvedSaleNames,
      involvedSaleEmails: user.involvedSaleEmails
    });

    // Parse JSON strings to arrays
    const involvedAccountNames = typeof user.involvedAccountNames === 'string' 
      ? JSON.parse(user.involvedAccountNames) 
      : user.involvedAccountNames;
    const involvedSaleNames = typeof user.involvedSaleNames === 'string' 
      ? JSON.parse(user.involvedSaleNames) 
      : user.involvedSaleNames;
    const involvedSaleEmails = typeof user.involvedSaleEmails === 'string' 
      ? JSON.parse(user.involvedSaleEmails) 
      : user.involvedSaleEmails;

    console.log('🔍 Profile Route - Parsed Data:', {
      involvedAccountNames,
      involvedSaleNames,
      involvedSaleEmails
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        staffId: user.staffId,
        email: user.email,
        involvedAccountNames: involvedAccountNames,
        involvedSaleNames: involvedSaleNames,
        involvedSaleEmails: involvedSaleEmails,
        role: user.role,
        canViewOthers: user.canViewOthers,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Profile fetch failed'
    });
  }
}));

// Update current user's profile (self-service). Users can edit their own
// name, staffId, email and assignment lists. Role/status/permissions are not editable here.
router.put(
  '/profile',
  [
    authenticateToken,
    requireUser,
    body('fullName').isLength({ min: 1 }).withMessage('Full name is required'),
    body('staffId').isLength({ min: 1 }).withMessage('Staff ID is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('involvedAccountNames').isArray().withMessage('involvedAccountNames must be an array'),
    body('involvedSaleNames').isArray().withMessage('involvedSaleNames must be an array'),
    body('involvedSaleEmails').isArray().withMessage('involvedSaleEmails must be an array'),
  ],
  asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const currentUser: any = (req as any).user;
    const {
      fullName,
      staffId,
      email,
      involvedAccountNames = [],
      involvedSaleNames = [],
      involvedSaleEmails = [],
    } = req.body;

    // Uniqueness checks for email and staffId (excluding current user)
    const existingEmail = await dbQueryOne('SELECT id FROM users WHERE email = ? AND id <> ?', [email, currentUser.id]);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    const existingStaff = await dbQueryOne('SELECT id FROM users WHERE staffId = ? AND id <> ?', [staffId, currentUser.id]);
    if (existingStaff) {
      return res.status(400).json({ success: false, message: 'Staff ID already in use' });
    }

    await dbExecute(
      `UPDATE users SET fullName = ?, staffId = ?, email = ?, involvedAccountNames = ?, involvedSaleNames = ?, involvedSaleEmails = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [
        fullName,
        staffId,
        email,
        JSON.stringify(involvedAccountNames),
        JSON.stringify(involvedSaleNames),
        JSON.stringify(involvedSaleEmails),
        currentUser.id,
      ]
    );

    return res.json({ success: true, message: 'Profile updated successfully' });
  })
);

// Admin reset user password (Admin only - no current password required)
router.post('/admin-reset-password', [
  authenticateToken,
  requireAdmin,
  body('userId').isLength({ min: 1 }).withMessage('User ID is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], asyncHandler(async (req: Request, res: Response): Promise<any> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed'
      });
    }

    const { userId, newPassword } = req.body;
    const adminUser = (req as any).user;
    
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // Check if target user exists
    const userRow: any = await dbQueryOne(
      'SELECT id, email, fullName FROM users WHERE id = ?',
      [userId]
    );

    if (!userRow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await dbExecute(
      'UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );

    console.log(`Admin ${adminUser.email} reset password for user ${userRow.email}`);
    
    return res.json({
      success: true,
      message: `Password successfully reset for ${userRow.fullName} (${userRow.email})`
    });
  } catch (error) {
    console.error('Admin password reset error:', error);
    return res.status(500).json({
      success: false,
      message: 'Password reset failed'
    });
  }
}));

// Change password
router.post('/change-password', [
  body('currentPassword').isLength({ min: 1 }).withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], asyncHandler(async (req: Request, res: Response): Promise<any> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed'
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = (req as any).user;
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const row: any = await dbQueryOne('SELECT password FROM users WHERE id = ?', [user.id]);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    try {
      const isValidPassword = await bcrypt.compare(currentPassword, row.password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await dbExecute(
        'UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, user.id]
      );

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Error during password change:', error);
      return res.status(500).json({
        success: false,
        message: 'Password change failed'
      });
    }
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Password change failed'
    });
  }
}));

// Update password route
router.post('/update-password', authenticateToken, [
  body('currentPassword').isLength({ min: 1 }).withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], asyncHandler(async (req: Request, res: Response): Promise<any> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = (req as any).user;
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await dbExecute(
      `UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [hashedNewPassword, user.id]
    );

    console.log('✅ Password updated successfully for user:', user.email);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Password update failed'
    });
  }
}));

// Approve pending user
router.post('/approve/:userId', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  console.log('🔍 Approve user request - userId:', userId);
  console.log('🔍 Request user:', (req as any).user);

  const row: any = await dbQueryOne('SELECT id, status FROM users WHERE id = ?', [userId]);
  if (!row) {
    console.log('❌ User not found with ID:', userId);
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  await dbExecute('UPDATE users SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', ['approved', userId]);
  console.log('✅ User approved successfully');
  res.json({ success: true, message: 'User approved successfully' });
});

// Reject pending user
router.post('/reject/:userId', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  console.log('🔍 Reject user request - userId:', userId);
  console.log('🔍 Request user:', (req as any).user);

  const row: any = await dbQueryOne('SELECT id, status FROM users WHERE id = ?', [userId]);
  if (!row) {
    console.log('❌ User not found with ID:', userId);
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  await dbExecute('UPDATE users SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', ['rejected', userId]);
  console.log('✅ User rejected successfully');
  res.json({ success: true, message: 'User rejected successfully' });
});

export { router as authRoutes };