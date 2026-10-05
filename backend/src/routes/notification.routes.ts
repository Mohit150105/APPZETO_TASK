import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// Get current user's notifications (paginated)
router.get('/', (req, res, next) => {
  notificationController.getNotifications(req, res, next);
});

// Mark single notification as read
router.patch('/:id/read', (req, res, next) => {
  notificationController.markAsRead(req, res, next);
});

// Mark all notifications as read
router.patch('/read-all', (req, res, next) => {
  notificationController.markAllAsRead(req, res, next);
});

export default router;
