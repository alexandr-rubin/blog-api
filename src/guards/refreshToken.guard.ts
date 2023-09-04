import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthorizationService } from '../authorization/authorization.service';
import { SecurityQueryRepository } from '../security/security.query-repository';
import { UserQueryRepository } from '../users/user.query-repository';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private readonly securityQueryRepository: SecurityQueryRepository, private readonly userQueryRepository: UserQueryRepository,
    private readonly authorizationService: AuthorizationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = await context.switchToHttp().getRequest();
    let token = ''

    try{
      token = await request.cookies.refreshToken
    }
    catch{
      throw new UnauthorizedException('No refresh token');
    }

    const device = await this.securityQueryRepository.getDeviceByToken(token);
    const isCompare = await this.securityQueryRepository.compareTokenDate(token);
    if (!device || !device.isValid || !isCompare) {
      throw new UnauthorizedException('Invalid device');
    }

    const userId = await this.authorizationService.getUserIdByToken(token);
    if (userId === null) {
      await this.authorizationService.logoutDevice(token);
      throw new UnauthorizedException('Invalid user');
    }

    const user = await this.userQueryRepository.getUsergByIdNoView(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }

    return true;
  }
}
