import { prisma } from '../database';
import { AppError } from '../middleware/error-handler';

export class InstanceLogsService {
  async list(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const logs = await prisma.instanceLog.findMany({
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
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    return {
      logs,
      stats: {
        logs: logs.length
      }
    };
  }
}

export const instanceLogsService = new InstanceLogsService();
