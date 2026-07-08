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

    const [messages, tokens, webhookLogs, logs] = await Promise.all([
      prisma.message.findMany({
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
        orderBy: { createdAt: 'desc' }
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
        orderBy: { createdAt: 'desc' }
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
        orderBy: { createdAt: 'desc' }
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
        take: 100
      })
    ]);

    return {
      user,
      instances,
      messages,
      tokens,
      webhookLogs,
      logs,
      stats: {
        instances: instances.length,
        messages: messages.length,
        tokens: tokens.length,
        webhookLogs: webhookLogs.length,
        logs: logs.length
      }
    };
  }
}

export const dashboardService = new DashboardService();
