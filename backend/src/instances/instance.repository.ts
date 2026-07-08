import type { Prisma, InstanceStatus } from '@prisma/client';
import { prisma } from '../database';

export class InstanceRepository {
  listByUser(userId: string) {
    return prisma.instance.findMany({
      where: { userId, deletedAt: null },
      include: { session: true, settings: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  findById(instanceId: string) {
    return prisma.instance.findUnique({
      where: { id: instanceId },
      include: { session: true, settings: true }
    });
  }

  findByIdAndUser(instanceId: string, userId: string) {
    return prisma.instance.findFirst({
      where: { id: instanceId, userId, deletedAt: null },
      include: { session: true, settings: true }
    });
  }

  create(userId: string, data: { name: string; phoneNumber: string | null }) {
    return prisma.instance.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
        settings: { create: {} }
      },
      include: { session: true, settings: true }
    });
  }

  update(instanceId: string, data: Prisma.InstanceUpdateInput) {
    return prisma.instance.update({
      where: { id: instanceId },
      data,
      include: { session: true, settings: true }
    });
  }

  updateStatus(instanceId: string, status: InstanceStatus, qrCode?: string | null) {
    return prisma.instance.update({
      where: { id: instanceId },
      data: {
        status,
        ...(qrCode !== undefined ? { qrCode } : {})
      },
      include: { session: true, settings: true }
    });
  }

  updatePhoneNumber(instanceId: string, phoneNumber: string | null) {
    return prisma.instance.update({
      where: { id: instanceId },
      data: { phoneNumber },
      include: { session: true, settings: true }
    });
  }

  updateSettings(instanceId: string, data: Prisma.InstanceSettingUpdateInput) {
    return prisma.instance.update({
      where: { id: instanceId },
      data: {
        settings: {
          upsert: {
            create: data as Prisma.InstanceSettingCreateWithoutInstanceInput,
            update: data
          }
        }
      },
      include: { session: true, settings: true }
    });
  }

  upsertSession(instanceId: string, authState: Prisma.InputJsonValue) {
    return prisma.instanceSession.upsert({
      where: { instanceId },
      create: {
        instance: { connect: { id: instanceId } },
        authState,
        lastSyncedAt: new Date()
      },
      update: {
        authState,
        lastSyncedAt: new Date()
      }
    });
  }

  deleteSession(instanceId: string) {
    return prisma.instanceSession.deleteMany({
      where: { instanceId }
    });
  }

  softDelete(instanceId: string) {
    return prisma.instance.update({
      where: { id: instanceId },
      data: {
        deletedAt: new Date(),
        status: 'DISCONNECTED',
        qrCode: null
      },
      include: { session: true, settings: true }
    });
  }

  createLog(instanceId: string, level: string, message: string, meta?: Prisma.InputJsonValue) {
    return prisma.instanceLog.create({
      data: {
        instance: { connect: { id: instanceId } },
        level,
        message,
        meta
      }
    });
  }
}
