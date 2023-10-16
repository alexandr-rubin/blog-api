import { CanActivate, ExecutionContext, Injectable,  UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { ConfigType } from '../config/configuration';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  constructor(private configService: ConfigService<ConfigType>){}
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

    const configCredentials = this.configService.get('BASIC_AUTH_CREDENTIALS') 

    if (credentials !== configCredentials) {
      throw new UnauthorizedException()
    }

    return true;
  }
}
