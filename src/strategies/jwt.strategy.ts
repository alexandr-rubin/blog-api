import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserQueryRepository } from '../users/user.query-repository';
import { ConfigService } from '@nestjs/config';
import { ConfigType } from 'src/config/configuration';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userQueryRepository: UserQueryRepository, private configService: ConfigService<ConfigType>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      //////////////////////////////////
      secretOrKey: configService.get('JWT_SECRET_KEY'),
    });
  }

  async validate(payload: any) {
    const user = await this.userQueryRepository.getUsergByIdNoView(payload.userId);

    if (!user) {
      throw new UnauthorizedException();
    }

    return { userId: payload.userId, ...user };
  }
}