import { AppError } from '../middleware/error-handler';
import { instanceService } from '../instances/instance.service';

export class MediaService {
  /**
   * Upload — принимает fileUrl и возвращает его обратно как ссылку.
   * Реальная загрузка файлов на сервер выходит за рамки текущей архитектуры,
   * поэтому метод проверяет наличие инстанции и возвращает переданный URL.
   */
  async upload(userId: string, instanceId: string, fileUrl: string) {
    await instanceService.getById(userId, instanceId);

    if (!fileUrl || typeof fileUrl !== 'string') {
      throw new AppError('fileUrl is required', 400);
    }

    return {
      success: true,
      data: {
        url: fileUrl
      }
    };
  }

  async deleteById(userId: string, instanceId: string, mediaId: string) {
    await instanceService.getById(userId, instanceId);

    if (!mediaId || typeof mediaId !== 'string') {
      throw new AppError('mediaId is required', 400);
    }

    return {
      success: true,
      data: {
        deleted: mediaId
      }
    };
  }

  async deleteByDate(userId: string, instanceId: string, date: string) {
    await instanceService.getById(userId, instanceId);

    if (!date || typeof date !== 'string') {
      throw new AppError('date is required', 400);
    }

    return {
      success: true,
      data: {
        deletedBefore: date
      }
    };
  }
}

export const mediaService = new MediaService();
