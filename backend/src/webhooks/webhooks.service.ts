import { prisma } from '../database';
import { AppError } from '../middleware/error-handler';
import { instanceService } from '../instances/instance.service';

export class WebhooksService {
  async list(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const instances = await instanceService.list(userId);
    const instanceIds = instances.map(instance => instance.id);

    const webhookLogs = await prisma.webhookLog.findMany({
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
    });

    return {
      instances,
      webhookLogs,
      stats: {
        instances: instances.length,
        webhookLogs: webhookLogs.length
      }
    };
  }
}

export const webhooksService = new WebhooksService();
