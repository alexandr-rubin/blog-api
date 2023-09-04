import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { LoginValidation } from 'src/validation/login';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authorizationService: AuthorizationService) {
    super();
  }

  async validate(loginData: LoginValidation): Promise<any> {
    const userId = await this.authorizationService.verifyUser(loginData)
    return userId
  }
}
