import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthService {
constructor(private readonly jwtService: JwtService) {}

async verifyToken(bearer: string): Promise<string> {
  try {
    const token = bearer.split(' ')[1]
    const verifyedToken = await this.jwtService.verifyAsync(token)
    return verifyedToken.userId
  } catch (err) {
      return ''
    }
  }
}
