import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/init';
import { User } from '../types';
import { createError } from './errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    console.log('🔍 Auth Middleware:', { 
      hasAuthHeader: !!authHeader, 
      hasToken: !!token,
      endpoint: req.path,
      method: req.method
    });

    if (!token) {
      console.error('❌ No token provided');
      throw createError('Access token required', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    console.log('🔍 Token decoded:', { userId: decoded.userId });
    
    const db = getDatabase();

    db.get(
      'SELECT * FROM users WHERE id = ?',
      [decoded.userId],
      (err, row: any) => {
        if (err) {
          console.error('Database error during authentication:', err);
          return next(createError('Authentication failed', 500));
        }

        if (!row) {
          return next(createError('User not found', 401));
        }

        console.log('🔍 Database User Row:', {
          id: row.id,
          email: row.email,
          involvedAccountNames: row.involvedAccountNames,
          involvedSaleNames: row.involvedSaleNames,
          involvedSaleEmails: row.involvedSaleEmails
        });

        // Parse JSON fields
        const user: User = {
          ...row,
          involvedAccountNames: JSON.parse(row.involvedAccountNames),
          involvedSaleNames: JSON.parse(row.involvedSaleNames),
          involvedSaleEmails: JSON.parse(row.involvedSaleEmails),
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt)
        };

        console.log('🔍 Parsed User Data:', {
          id: user.id,
          email: user.email,
          involvedAccountNames: user.involvedAccountNames,
          involvedSaleNames: user.involvedSaleNames,
          involvedSaleEmails: user.involvedSaleEmails
        });

        req.user = user;
        next();
      }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        next(createError('Invalid token', 401));
      } else if (error.name === 'TokenExpiredError') {
        next(createError('Token expired', 401));
      } else {
        next(error);
      }
    } else {
      next(createError('Authentication failed', 401));
    }
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    console.log('🔍 requireRole check:', { 
      hasUser: !!req.user, 
      userRole: req.user?.role, 
      requiredRoles: roles,
      endpoint: req.path
    });

    if (!req.user) {
      console.error('❌ No user in request');
      next(createError('Authentication required', 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      console.error('❌ Insufficient permissions:', { 
        userRole: req.user.role, 
        requiredRoles: roles 
      });
      next(createError('Insufficient permissions', 403));
      return;
    }

    console.log('✅ Role check passed');
    next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireUser = requireRole(['user', 'admin']);

export const canViewUser = (targetUserId: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      next(createError('Authentication required', 401));
      return;
    }

    // Admin can view all users
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // User can view themselves
    if (req.user.id === targetUserId) {
      next();
      return;
    }

    // Check if user has permission to view others
    if (req.user.canViewOthers) {
      const db = getDatabase();
      
      db.get(
        'SELECT * FROM users WHERE id = ?',
        [targetUserId],
        (err, targetUser: any) => {
          if (err) {
            console.error('Database error checking user permissions:', err);
            next(createError('Permission check failed', 500));
            return;
          }

          if (!targetUser) {
            next(createError('Target user not found', 404));
            return;
          }

          // Check if users share any accounts
          const userAccounts = req.user!.involvedAccountNames;
          const targetAccounts = JSON.parse(targetUser.involvedAccountNames);
          
          const hasSharedAccount = userAccounts.some((account: string) => 
            targetAccounts.includes(account)
          );

          if (hasSharedAccount) {
            next();
          } else {
            next(createError('Insufficient permissions to view this user', 403));
          }
        }
      );
    } else {
      next(createError('Insufficient permissions to view other users', 403));
    }
  };
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};
