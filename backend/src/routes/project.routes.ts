import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { requireAuth } from '../middleware/auth';
import { requireOrganizationMember, requireOrganizationRole } from '../middleware/tenant';
import { validate } from '../middleware/validate';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator';

const router = Router();

router.use(requireAuth);
router.use(requireOrganizationMember);

// List projects for active organization
router.get('/', (req, res, next) => {
  projectController.getProjects(req, res, next);
});

// Create project (ADMIN, OWNER)
router.post(
  '/',
  requireOrganizationRole('OWNER', 'ADMIN'),
  validate(createProjectSchema),
  (req, res, next) => {
    projectController.createProject(req, res, next);
  }
);

// Get project details
router.get('/:id', (req, res, next) => {
  projectController.getProjectById(req, res, next);
});

// Update project (ADMIN, OWNER)
router.put(
  '/:id',
  requireOrganizationRole('OWNER', 'ADMIN'),
  validate(updateProjectSchema),
  (req, res, next) => {
    projectController.updateProject(req, res, next);
  }
);

// Delete project (ADMIN, OWNER)
router.delete(
  '/:id',
  requireOrganizationRole('OWNER', 'ADMIN'),
  (req, res, next) => {
    projectController.deleteProject(req, res, next);
  }
);

export default router;
