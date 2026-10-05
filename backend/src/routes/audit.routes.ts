import { Router } from 'express';
import { auditController } from '../controllers/audit.controller';
import { requireAuth } from '../middleware/auth';
import { requireOrganizationMember, requireOrganizationRole } from '../middleware/tenant';

const router = Router();

router.use(requireAuth);
router.use(requireOrganizationMember);

// Audit logs are strictly restricted to Organization ADMIN and OWNER
router.get(
  '/',
  requireOrganizationRole('OWNER', 'ADMIN'),
  (req, res, next) => {
    auditController.getAuditLogs(req, res, next);
  }
);

export default router;
