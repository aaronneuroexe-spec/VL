import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
    throttler: any,
    getTracker: any,
    generateKey: (context: ExecutionContext, suffix: string, name: string) => string,
  ): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const clientIp = this.getClientIp(req);

    if (await this.isBlacklisted(clientIp)) {
      throw new HttpException('IP blocked', HttpStatus.FORBIDDEN);
    }

    const adjustedLimit = await this.getAdjustedLimit(clientIp, limit);
    return super.handleRequest(
      context,
      adjustedLimit,
      ttl,
      throttler,
      getTracker,
      generateKey,
    );
  }

  protected generateKey(
    context: ExecutionContext,
    suffix: string,
    name: string,
  ): string {
    const req = context.switchToHttp().getRequest<Request>();
    const clientIp = this.getClientIp(req);
    const userId = (req as any).user?.id ?? 'anonymous';
    return `rate_limit:${clientIp}:${userId}:${suffix}`;
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string) ||
      (req.headers['x-real-ip'] as string) ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown'
    )
      .toString()
      .split(',')[0]
      .trim();
  }

  private async isBlacklisted(ip: string): Promise<boolean> {
    const blacklistedIPs = ['192.168.1.100'];
    return blacklistedIPs.includes(ip);
  }

  private async getAdjustedLimit(
    ip: string,
    defaultLimit: number,
  ): Promise<number> {
    const suspiciousIPs = ['192.168.1.101'];
    if (suspiciousIPs.includes(ip)) {
      return Math.floor(defaultLimit * 0.5);
    }
    return defaultLimit;
  }
}
