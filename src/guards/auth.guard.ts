import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UserQueryRepository } from '../users/user.query-repository';
import { ConfigService } from '@nestjs/config';
import { ConfigType } from '../config/configuration';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private reflector: Reflector, private readonly userQueryRepository: UserQueryRepository,
  private configService: ConfigService<ConfigType>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const JWT_SECRET_KEY = this.configService.get('JWT_SECRET_KEY')
      const payload = await this.jwtService.verifyAsync(token, {
        secret: JWT_SECRET_KEY,
      }); 
      const user = await this.userQueryRepository.getUsergByIdNoView(payload.userId)
      request['user'] = {userId: payload.userId, ...user};
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
