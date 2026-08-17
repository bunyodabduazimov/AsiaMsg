import { Prisma } from '@prisma/client';
import { prisma } from '../database';
import { AppError } from '../middleware/error-handler';
import { instanceService } from '../instances/instance.service';

export class DashboardService {
  async getDashboard(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const instances = await instanceService.list(userId);
    const instanceIds = instances.map(instance => instance.id);
    const sentToday = instances.reduce((sum, instance) => {
      const value = 'messagesToday' in instance ? instance.messagesToday : 0;
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
    const activityDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return date;
    });
    const toDayKey = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const activityStart = activityDays[0];
    const activityEnd = new Date(activityDays[activityDays.length - 1]);
    activityEnd.setDate(activityEnd.getDate() + 1);
    const visibleMessagesWhere = {
      instanceId: { in: instanceIds },
      remoteJid: { not: 'status@broadcast' }
    };

    const [
      messages,
      tokens,
      webhookLogs,
      logs,
      totalMessages,
      queuedMessages,
      deliveredMessages,
      errorMessages,
      tokensCount,
      webhookLogsCount,
      logsCount,
      activityRows
    ] = await Promise.all([
      prisma.message.findMany({
        where: visibleMessagesWhere,
        include: {
          instance: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.apiToken.findMany({
        where: {
          instanceId: { in: instanceIds }
        },
        include: {
          instance: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.webhookLog.findMany({
        where: {
          instanceId: { in: instanceIds }
        },
        include: {
          instance: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.instanceLog.findMany({
        where: {
          instanceId: { in: instanceIds }
        },
        include: {
          instance: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.message.count({ where: visibleMessagesWhere }),
      prisma.message.count({ where: { ...visibleMessagesWhere, status: 'queued' } }),
      prisma.message.count({ where: { ...visibleMessagesWhere, status: { in: ['sent', 'delivered'] } } }),
      prisma.message.count({ where: { ...visibleMessagesWhere, status: { in: ['failed', 'error'] } } }),
      prisma.apiToken.count({ where: { instanceId: { in: instanceIds } } }),
      prisma.webhookLog.count({ where: { instanceId: { in: instanceIds } } }),
      prisma.instanceLog.count({ where: { instanceId: { in: instanceIds } } }),
      instanceIds.length
        ? prisma.$queryRaw<Array<{ day: string | Date; count: bigint | number }>>`
          SELECT DATE(createdAt) AS day, COUNT(*) AS count
          FROM Message
          WHERE instanceId IN (${Prisma.join(instanceIds)})
            AND remoteJid <> 'status@broadcast'
            AND createdAt >= ${activityStart}
            AND createdAt < ${activityEnd}
          GROUP BY DATE(createdAt)
          ORDER BY day ASC
        `
        : Promise.resolve([])
    ]);
    const activityCountMap = new Map(
      activityRows.map(row => {
        const rawDay = row.day instanceof Date ? toDayKey(row.day) : String(row.day).slice(0, 10);
        return [rawDay, Number(row.count)];
      })
    );

    return {
      user,
      instances,
      messages,
      tokens,
      webhookLogs,
      logs,
      stats: {
        instances: instances.length,
        messages: totalMessages,
        queuedMessages,
        deliveredMessages,
        errorMessages,
        sentToday,
        tokens: tokensCount,
        webhookLogs: webhookLogsCount,
        logs: logsCount,
        messageActivity: activityDays.map(day => ({
          date: toDayKey(day),
          count: activityCountMap.get(toDayKey(day)) ?? 0
        }))
      }
    };
  }
}

export const dashboardService = new DashboardService();
