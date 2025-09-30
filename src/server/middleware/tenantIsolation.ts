import { Request, Response, NextFunction } from 'express';
import { dbQueryOne } from '../database/init';
import { createError } from './errorHandler';
import { AuthRequest } from './auth';

export const enforceTenantIsolation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    // Global Admin can access all tenants
    if (req.user.email === 'global@asc.com') {
      return next();
    }

    const tenantPrefix = (req as any).tenantPrefix;
    
    if (!tenantPrefix) {
      // If no tenant prefix in URL, this might be a global route
      // Allow access for authenticated users without tenant context
      return next();
    }

    // Verify user belongs to the requested tenant
    if (req.user.tenantId) {
      const tenantRow: any = await dbQueryOne(
        'SELECT * FROM tenants WHERE id = ? AND prefix = ?', 
        [req.user.tenantId, tenantPrefix]
      );
      
      if (!tenantRow) {
        console.error('❌ Tenant isolation violation:', { 
          userId: req.user.id, 
          userEmail: req.user.email,
          userTenantId: req.user.tenantId, 
          requestedPrefix: tenantPrefix,
          endpoint: req.path
        });
        return next(createError('Access denied: Invalid tenant access', 403));
      }
    } else {
      // User has no tenant assigned - deny access to tenant-specific routes
      console.error('❌ User has no tenant assigned:', { 
        userId: req.user.id, 
        userEmail: req.user.email,
        requestedPrefix: tenantPrefix,
        endpoint: req.path
      });
      return next(createError('Access denied: User not assigned to any tenant', 403));
    }

    next();
  } catch (error) {
    console.error('❌ Tenant isolation error:', error);
    next(createError('Tenant isolation check failed', 500));
  }
};

// Middleware to ensure all database queries are scoped to the user's tenant
export const scopeQueriesToTenant = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.email === 'global@asc.com') {
    // Global admin can see all data
    return next();
  }

  // Add tenant scoping to request for use in route handlers
  (req as any).tenantScope = {
    tenantId: req.user.tenantId,
    tenantPrefix: (req as any).tenantPrefix
  };

  next();
};