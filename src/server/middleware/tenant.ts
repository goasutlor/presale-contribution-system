import { Request, Response, NextFunction } from 'express';
import { dbQueryOne } from '../database/init';

export interface TenantAwareRequest extends Request {
  tenantPrefix?: string;
  tenantId?: string;
}

export const tenantContext = async (req: TenantAwareRequest, res: Response, next: NextFunction) => {
  try {
    const enabled = process.env.ENABLE_TENANCY === '1' || process.env.ENABLE_TENANCY === 'true';
    const defaultPrefix = process.env.DEFAULT_TENANT_PREFIX || 'default';

    // Resolve prefix from header or path or existing
    const headerPrefix = req.header('x-tenant-prefix');
    const pathMatch = req.path.match(/^\/t\/([a-zA-Z0-9_-]+)(\/|$)/);
    const resolvedPrefix = (req.tenantPrefix || headerPrefix || (pathMatch ? pathMatch[1] : '') || '').trim() || defaultPrefix;

    req.tenantPrefix = resolvedPrefix;

    if (!enabled) {
      // In non-tenant mode, everything is in default tenant
      req.tenantId = 'tenant-default';
      return next();
    }

    // Lookup tenant by prefix
    const tenant = await dbQueryOne('SELECT id FROM tenants WHERE tenantPrefix = ?', [resolvedPrefix]);
    if (tenant && tenant.id) {
      req.tenantId = tenant.id;
      return next();
    }

    // Fallback to default tenant
    const fallback = await dbQueryOne('SELECT id FROM tenants WHERE tenantPrefix = ?', [defaultPrefix]);
    req.tenantId = fallback ? fallback.id : 'tenant-default';
    return next();
  } catch (err) {
    // On error, still continue with default tenant to avoid 5xx in staging
    req.tenantId = 'tenant-default';
    next();
  }
};


