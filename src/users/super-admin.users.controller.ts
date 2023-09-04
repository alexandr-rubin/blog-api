import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { HttpStatusCode } from "../helpers/httpStatusCode";
import { QueryParamsModel } from "../models/PaginationQuery";
import { UserQueryRepository } from "./user.query-repository";
import { UserIdValidationPipe } from "../validation/pipes/user-Id-validation.pipe";
import { BasicAuthGuard } from "../guards/basic-auth.guard";
import { EmailOrLoginExistsPipe } from "../validation/pipes/email-login-exist.pipe";
import { UserInputModel } from "./models/input/UserInput";
import { BanUserInputModel } from "./models/input/BanUserInput";
import { SecurityService } from "../security/security.service";

@UseGuards(BasicAuthGuard)
@Controller('sa/users')
export class UsersController {
  constructor(private readonly userService: UserService, private readonly userQueryRepository: UserQueryRepository, private readonly securityService: SecurityService){}
  @Get()
  async getUsers(@Query() params: QueryParamsModel) {
    return await this.userQueryRepository.getUsers(params)
  }
  @HttpCode(HttpStatusCode.CREATED_201)
  @Post()
  async createUser(@Body(EmailOrLoginExistsPipe) user: UserInputModel) {
    return await this.userService.createUser(user)
  }

  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Delete(':id')
  async deleteUserById(@Param('id', UserIdValidationPipe) id: string) {
    return await this.userService.deleteUserById(id) 
  }

  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Put(':userId/ban')
  async banOrUnbanUserById(@Body() banInfo: BanUserInputModel, @Param('userId', UserIdValidationPipe) userId: string) {
    if(banInfo.isBanned){
      await this.securityService.terminateBannedUserSessions(userId)
    }
    
    return await this.userService.banOrUnbanUserById(userId, banInfo.isBanned, banInfo.banReason)
  }
}