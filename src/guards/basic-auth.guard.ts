import { CanActivate, ExecutionContext, Injectable,  UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateBasicAuth(request);
  }

  private validateBasicAuth(request: any): boolean {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException()
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');

    if (credentials !== 'admin:qwerty') {
      throw new UnauthorizedException()
    }

    return true;
  }
}
