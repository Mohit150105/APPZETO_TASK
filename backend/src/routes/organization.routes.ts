import { Router } from 'express';
import { organizationController } from '../controllers/organization.controller';
import { requireAuth } from '../middleware/auth';
import { requireOrganizationMember, requireOrganizationRole } from '../middleware/tenant';
import { validate } from '../middleware/validate';
import { createOrgSchema, addMemberSchema } from '../validators/organization.validator';

const router = Router();

// All organization routes require authenticated user
router.use(requireAuth);

// Create new organization
router.post('/', validate(createOrgSchema), (req, res, next) => {
  organizationController.createOrg(req, res, next);
});

// List all organizations current user belongs to
router.get('/', (req, res, next) => {
  organizationController.getOrgs(req, res, next);
});

// Get organization details
router.get('/:id', requireOrganizationMember, (req, res, next) => {
  organizationController.getOrgById(req, res, next);
});

// List members of organization
router.get('/:id/members', requireOrganizationMember, (req, res, next) => {
  organizationController.getMembers(req, res, next);
});

// Add member to organization (ADMIN, OWNER)
router.post(
  '/:id/members',
  requireOrganizationMember,
  requireOrganizationRole('OWNER', 'ADMIN'),
  validate(addMemberSchema),
  (req, res, next) => {
    organizationController.addMember(req, res, next);
  }
);

// Remove member from organization (ADMIN, OWNER)
router.delete(
  '/:id/members/:userId',
  requireOrganizationMember,
  requireOrganizationRole('OWNER', 'ADMIN'),
  (req, res, next) => {
    organizationController.removeMember(req, res, next);
  }
);

export default router;
