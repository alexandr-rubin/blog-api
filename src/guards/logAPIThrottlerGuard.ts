import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerException, ThrottlerGuard, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { SecurityService } from '../security/security.service';

@Injectable()
export class LogAPIThrottlerGuard extends ThrottlerGuard {
  constructor(options: ThrottlerModuleOptions, storageService: ThrottlerStorage, reflector: Reflector,
    private readonly scurityService: SecurityService) {
    super(options, storageService, reflector);
  }

  async handleRequest(context: ExecutionContext): Promise<boolean> {
    const request = await context.switchToHttp().getRequest()
    const currentDate = new Date()
    const tenSecondsAgo = new Date(currentDate.getTime() - 10 * 1000)

    const filter = {
      IP: request.ip,
      URL: request.originalUrl,
      date: { $gte: tenSecondsAgo.toISOString() },
    }

    const count = await this.scurityService.countDoc(filter)
    if (count >= 5) {
      throw new ThrottlerException()
    }

    const logEntry = { ...filter, date: currentDate.toISOString() }
    const isAdded = await this.scurityService.addLog(logEntry)

    if (!isAdded) {
      throw new ThrottlerException()
    }

    return true
  }
}
