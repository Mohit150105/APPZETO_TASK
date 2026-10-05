import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { app } from '../backend/src/app';
import { config } from '../backend/src/config/env';
import { User } from '../backend/src/models/User';
import { Organization } from '../backend/src/models/Organization';
import { OrganizationMember } from '../backend/src/models/OrganizationMember';
import { Project } from '../backend/src/models/Project';
import { Task } from '../backend/src/models/Task';
import { UserRole } from '../backend/src/types';

import { connectDB, disconnectDB } from '../backend/src/config/db';

let mongoServer: MongoMemoryServer;

export const setupTestDB = () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await connectDB(uri);
  });

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });
};

export const createTestUser = async (email: string = 'test@example.com', name: string = 'Test User') => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);
  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, name: user.name },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  return { user, token };
};

export const createTestOrg = async (userId: string, name: string = 'Test Org') => {
  const org = await Organization.create({
    name,
    createdBy: new mongoose.Types.ObjectId(userId),
  });

  const member = await OrganizationMember.create({
    organizationId: org._id,
    userId: new mongoose.Types.ObjectId(userId),
    role: 'OWNER',
  });

  return { org, member };
};

export const addTestMember = async (orgId: string, userId: string, role: UserRole = 'MEMBER') => {
  return OrganizationMember.create({
    organizationId: new mongoose.Types.ObjectId(orgId),
    userId: new mongoose.Types.ObjectId(userId),
    role,
  });
};

export const createTestProject = async (orgId: string, userId: string, name: string = 'Project A') => {
  return Project.create({
    organizationId: new mongoose.Types.ObjectId(orgId),
    name,
    description: 'Test project description',
    createdBy: new mongoose.Types.ObjectId(userId),
  });
};

export const createTestTask = async (
  orgId: string,
  projectId: string,
  userId: string,
  title: string = 'Task 1'
) => {
  return Task.create({
    organizationId: new mongoose.Types.ObjectId(orgId),
    projectId: new mongoose.Types.ObjectId(projectId),
    title,
    description: 'Task description',
    status: 'TODO',
    priority: 'MEDIUM',
    createdBy: new mongoose.Types.ObjectId(userId),
    version: 1,
  });
};

export { app };
