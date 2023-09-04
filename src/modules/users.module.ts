// import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { UsersController } from '../controllers/users.controller';
// import { UserService } from '../domain/user.service';
// import { User, UserSchema } from '../models/User';
// import { UserQueryRepository } from '../queryRepositories/user.query-repository';
// import { UserRepository } from '../repositories/user.repository';
// import { UserExistValidator } from '../validation/UserExistValidator';
// import { BasicAuthGuard } from '../guards/basic-auth.guard';

// @Module({
//   imports: [
//     MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
// ],
//   controllers: [UsersController],
//   providers: [UserService, UserQueryRepository, UserRepository, UserExistValidator, BasicAuthGuard],
//   exports: [UserService, UserQueryRepository, UserRepository, UserExistValidator,   MongooseModule],
// })
// export class UsersModule {}
