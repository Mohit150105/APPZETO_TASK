import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { requireAuth } from '../middleware/auth';
import { requireOrganizationMember, requireOrganizationRole } from '../middleware/tenant';
import { validate } from '../middleware/validate';
import { uploadAttachment } from '../middleware/upload';
import {
  createTaskSchema,
  updateTaskSchema,
  queryTaskSchema,
} from '../validators/task.validator';
import { createCommentSchema } from '../validators/comment.validator';

const router = Router();

router.use(requireAuth);
router.use(requireOrganizationMember);

// List/Search tasks
router.get('/', validate(queryTaskSchema), (req, res, next) => {
  taskController.getTasks(req, res, next);
});

// Create task (MEMBER, ADMIN, OWNER)
router.post(
  '/',
  requireOrganizationRole('OWNER', 'ADMIN', 'MEMBER'),
  validate(createTaskSchema),
  (req, res, next) => {
    taskController.createTask(req, res, next);
  }
);

// Get task details
router.get('/:id', (req, res, next) => {
  taskController.getTaskById(req, res, next);
});

// Update task (MEMBER, ADMIN, OWNER)
router.put(
  '/:id',
  requireOrganizationRole('OWNER', 'ADMIN', 'MEMBER'),
  validate(updateTaskSchema),
  (req, res, next) => {
    taskController.updateTask(req, res, next);
  }
);

// Delete task (ADMIN, OWNER)
router.delete(
  '/:id',
  requireOrganizationRole('OWNER', 'ADMIN'),
  (req, res, next) => {
    taskController.deleteTask(req, res, next);
  }
);

// Add comment to task (MEMBER, ADMIN, OWNER)
router.post(
  '/:id/comments',
  requireOrganizationRole('OWNER', 'ADMIN', 'MEMBER'),
  validate(createCommentSchema),
  (req, res, next) => {
    taskController.addComment(req, res, next);
  }
);

// List comments for task
router.get('/:id/comments', (req, res, next) => {
  taskController.getComments(req, res, next);
});

// Upload attachment to task (MEMBER, ADMIN, OWNER)
router.post(
  '/:id/attachments',
  requireOrganizationRole('OWNER', 'ADMIN', 'MEMBER'),
  uploadAttachment.single('file'),
  (req, res, next) => {
    taskController.uploadAttachment(req, res, next);
  }
);

export default router;
