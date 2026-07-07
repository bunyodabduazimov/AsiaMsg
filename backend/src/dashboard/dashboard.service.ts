import { prisma } from '../database';
import { AppError } from '../middleware/error-handler';

export class DashboardService {
  async getDashboard(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const [instances, messages, tokens, webhookLogs, logs] = await Promise.all([
      prisma.instance.findMany({
        where: { userId },
        include: {
          settings: true,
          session: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.message.findMany({
        where: {
          instance: {
            userId
          }
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
          instance: {
            userId
          }
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
          instance: {
            userId
          }
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
          instance: {
            userId
          }
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
