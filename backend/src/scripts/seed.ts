import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { OrganizationMember } from '../models/OrganizationMember';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { Comment } from '../models/Comment';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';

export const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      OrganizationMember.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      Comment.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('[Seed] Creating demo users...');
    const defaultPassword = 'Password123!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    const users = await User.create([
      {
        name: 'Sarah Connor (Owner)',
        email: 'owner@acme.com',
        passwordHash,
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      },
      {
        name: 'Alex Rivera (Admin)',
        email: 'admin@acme.com',
        passwordHash,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      },
      {
        name: 'David Kim (Member)',
        email: 'member@acme.com',
        passwordHash,
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      },
      {
        name: 'Elena Rostova (Viewer)',
        email: 'viewer@acme.com',
        passwordHash,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
      {
        name: 'Marcus Vance (Multi-Org User)',
        email: 'marcus@globex.com',
        passwordHash,
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      },
    ]);

    const [owner, admin, member, viewer, multiUser] = users;

    console.log('[Seed] Creating organizations...');
    const orgAcme = await Organization.create({
      name: 'Acme Corporation',
      createdBy: owner._id,
    });

    const orgGlobex = await Organization.create({
      name: 'Globex Robotics',
      createdBy: multiUser._id,
    });

    console.log('[Seed] Assigning organization memberships...');
    await OrganizationMember.create([
      // Acme Corp memberships
      { organizationId: orgAcme._id, userId: owner._id, role: 'OWNER' },
      { organizationId: orgAcme._id, userId: admin._id, role: 'ADMIN' },
      { organizationId: orgAcme._id, userId: member._id, role: 'MEMBER' },
      { organizationId: orgAcme._id, userId: viewer._id, role: 'VIEWER' },
      { organizationId: orgAcme._id, userId: multiUser._id, role: 'MEMBER' }, // Multi-org membership

      // Globex Robotics memberships
      { organizationId: orgGlobex._id, userId: multiUser._id, role: 'OWNER' },
      { organizationId: orgGlobex._id, userId: admin._id, role: 'VIEWER' },
    ]);

    console.log('[Seed] Creating projects...');
    const projectCloud = await Project.create({
      organizationId: orgAcme._id,
      name: 'Cloud Infrastructure Migration',
      description: 'Migrating legacy monolith workloads to Kubernetes and MongoDB clusters.',
      createdBy: admin._id,
    });

    const projectMobile = await Project.create({
      organizationId: orgAcme._id,
      name: 'Mobile App Redesign v2',
      description: 'Overhaul UI/UX design with React Native and real-time collaboration.',
      createdBy: owner._id,
    });

    const projectGlobexAI = await Project.create({
      organizationId: orgGlobex._id,
      name: 'Autonomous Drone Navigation',
      description: 'Sensor fusion and real-time telemetry processing backend.',
      createdBy: multiUser._id,
    });

    console.log('[Seed] Creating tasks...');
    const now = new Date();
    const futureDate = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const task1 = await Task.create({
      organizationId: orgAcme._id,
      projectId: projectCloud._id,
      title: 'Configure Production MongoDB Atlas Sharding',
      description: 'Set up high-availability replica set with automated backups and VPC peering.',
      status: 'DONE',
      priority: 'HIGH',
      assigneeId: admin._id,
      labels: ['DevOps', 'Database', 'Security'],
      dueDate: futureDate(5),
      createdBy: owner._id,
      version: 1,
    });

    const task2 = await Task.create({
      organizationId: orgAcme._id,
      projectId: projectCloud._id,
      title: 'Implement Multi-Tenant RBAC Authorization Guards',
      description: 'Enforce OWNER, ADMIN, MEMBER, and VIEWER roles across all Express API routes.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      assigneeId: member._id,
      labels: ['Security', 'Backend', 'API'],
      dueDate: futureDate(2),
      createdBy: admin._id,
      version: 1,
    });

    const task3 = await Task.create({
      organizationId: orgAcme._id,
      projectId: projectCloud._id,
      title: 'Setup Socket.IO Room-Based Real-Time Collaboration',
      description: 'Establish authenticated websocket connection and project-scoped room relays.',
      status: 'REVIEW',
      priority: 'HIGH',
      assigneeId: member._id,
      labels: ['WebSockets', 'Frontend'],
      dueDate: futureDate(3),
      createdBy: admin._id,
      version: 1,
    });

    const task4 = await Task.create({
      organizationId: orgAcme._id,
      projectId: projectCloud._id,
      title: 'Prepare Docker Compose & Local Development Environment',
      description: 'Create multi-container docker-compose setup for frontend, backend, and database.',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeId: null, // Unassigned
      labels: ['Docker', 'DevOps'],
      dueDate: futureDate(10),
      createdBy: admin._id,
      version: 1,
    });

    const task5 = await Task.create({
      organizationId: orgAcme._id,
      projectId: projectMobile._id,
      title: 'Design Mobile Kanban Board Touch Gestures',
      description: 'Implement fluid drag and drop for touch screen devices with haptic feedback.',
      status: 'TODO',
      priority: 'LOW',
      assigneeId: multiUser._id,
      labels: ['UI/UX', 'Mobile'],
      dueDate: futureDate(14),
      createdBy: owner._id,
      version: 1,
    });

    console.log('[Seed] Creating comments...');
    await Comment.create([
      {
        taskId: task2._id,
        organizationId: orgAcme._id,
        userId: admin._id,
        content: 'Please make sure tenant isolation is verified by automated integration tests.',
        mentions: [member._id],
      },
      {
        taskId: task2._id,
        organizationId: orgAcme._id,
        userId: member._id,
        content: 'Working on it! All route tests will include cross-tenant access verification.',
        mentions: [admin._id],
      },
    ]);

    console.log('[Seed] Creating notifications...');
    await Notification.create([
      {
        recipientId: member._id,
        organizationId: orgAcme._id,
        type: 'TASK_ASSIGNED',
        message: 'You were assigned to task "Implement Multi-Tenant RBAC Authorization Guards"',
        relatedEntity: { entityType: 'Task', entityId: task2._id },
        read: false,
      },
      {
        recipientId: member._id,
        organizationId: orgAcme._id,
        type: 'MENTION',
        message: 'Alex Rivera mentioned you in a comment on task "Implement Multi-Tenant RBAC Authorization Guards"',
        relatedEntity: { entityType: 'Task', entityId: task2._id },
        read: true,
      },
    ]);

    console.log('[Seed] Creating audit logs...');
    await AuditLog.create([
      {
        userId: owner._id,
        organizationId: orgAcme._id,
        action: 'ORG_CREATED',
        entity: 'Organization',
        entityId: orgAcme._id,
        newValue: { name: 'Acme Corporation' },
        timestamp: new Date(Date.now() - 3600000 * 24),
      },
      {
        userId: admin._id,
        organizationId: orgAcme._id,
        action: 'PROJECT_CREATED',
        entity: 'Project',
        entityId: projectCloud._id,
        newValue: { name: 'Cloud Infrastructure Migration' },
        timestamp: new Date(Date.now() - 3600000 * 12),
      },
      {
        userId: admin._id,
        organizationId: orgAcme._id,
        action: 'TASK_CREATED',
        entity: 'Task',
        entityId: task2._id,
        newValue: { title: task2.title, status: task2.status },
        timestamp: new Date(Date.now() - 3600000 * 4),
      },
      {
        userId: member._id,
        organizationId: orgAcme._id,
        action: 'TASK_STATUS_CHANGED',
        entity: 'Task',
        entityId: task1._id,
        oldValue: { status: 'REVIEW' },
        newValue: { status: 'DONE' },
        timestamp: new Date(Date.now() - 3600000 * 2),
      },
    ]);

    console.log('\n======================================================');
    console.log('✅ SEED COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('Test Credentials (Password for all: Password123!):');
    console.log('1. OWNER:       owner@acme.com');
    console.log('2. ADMIN:       admin@acme.com');
    console.log('3. MEMBER:      member@acme.com');
    console.log('4. VIEWER:      viewer@acme.com');
    console.log('5. MULTI-ORG:   marcus@globex.com (Member in Acme, Owner in Globex)');
    console.log('======================================================\n');
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
    throw err;
  } finally {
    await disconnectDB();
  }
};

if (require.main === module) {
  seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}
