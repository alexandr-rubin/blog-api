// import { Module } from '@nestjs/common';
// import { AuthorizationController } from '../controllers/authorization.controller';
// import { AuthorizationService } from '../domain/authorization.service';
// import { AuthorizationRepository } from '../repositories/authorization.repository';
// import { PasswordRecoveryCodeExistValidator } from '../validation/passwordRecCodeValid';
// import { PasswordRecoveryCodeValidPipe } from '../validation/pipes/password-recovery-code-valid.pipe';
// import { UsersModule } from './users.module';
// import { EmailModule } from './email.module';
// import { JwtModule } from '@nestjs/jwt';
// import * as dotenv from 'dotenv'
// import { AuthGuard } from '../guards/auth.guard';
// import { APP_GUARD } from '@nestjs/core';
// import { LoginValidation } from '../validation/login';
// import { LoginValidationPipe } from '../validation/pipes/login-validation.pipe';
// import { Device, DeviceSchema } from '../models/Device';
// import { MongooseModule } from '@nestjs/mongoose';
// import { SecurityController } from '../controllers/security.controller';
// import { SecurityService } from '../domain/security.service';
// import { SecurityRepository } from '../repositories/security.repository';
// import { SecurityQueryRepository } from '../queryRepositories/security.query-repository';
// import { RefreshTokenGuard } from '../guards/refreshToken.guard';
// import { BasicAuthGuard } from '../guards/basic-auth.guard';
// /////////////
// dotenv.config()

// const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'secretkey'

// @Module({
//   imports: [
//     UsersModule,
//     EmailModule,
//     JwtModule.register({
//       global: true,
//       secret: JWT_SECRET_KEY,
//       signOptions: { expiresIn: '5m' },
//     }),
//     MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
//   ],
//   controllers: [AuthorizationController, SecurityController],
//   providers: [AuthorizationService, AuthorizationRepository, PasswordRecoveryCodeExistValidator, PasswordRecoveryCodeValidPipe,
//     {
//       provide: APP_GUARD,
//       useClass: AuthGuard,
//     },
//   LoginValidation, LoginValidationPipe, SecurityService, SecurityRepository, SecurityQueryRepository, RefreshTokenGuard, BasicAuthGuard],
//   exports: [AuthorizationService]
// })
// export class AuthModule {}