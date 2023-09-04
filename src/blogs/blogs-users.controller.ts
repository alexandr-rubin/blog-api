import { Body, Controller, Get, HttpCode, Param, Put, Query, Req, UseGuards } from "@nestjs/common";
import { HttpStatusCode } from "../helpers/httpStatusCode";
import { BlogService } from "./blog.service";
import { BlogQueryRepository } from "./blog.query-repository";
import { AccessTokenVrifyModel } from "../authorization/models/input/Auth";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { UserQueryRepository } from "../users/user.query-repository";
import { UserIdValidationPipe } from "../validation/pipes/user-Id-validation.pipe";
import { BanUserForBlogInputModel } from "./models/input/BanUserForBlogInputModel";
import { QueryParamsModel } from "../models/PaginationQuery";
import { BlogIdValidationPipe } from "../validation/pipes/blog-Id-validation.pipe";

@UseGuards(JwtAuthGuard/*, RolesGuard*/)
//@Roles(UserRoles.User)
@Controller('blogger/users')
export class BloggerBlogsUsersController {
  constructor(private readonly blogService: BlogService, private readonly blogQueryRepository: BlogQueryRepository, private readonly userQueryRepository: UserQueryRepository){}

  @Get('blog/:blogId')
  async getBlogs(@Param('blogId', BlogIdValidationPipe) blogId: string, @Query() params: QueryParamsModel, @Req() req: AccessTokenVrifyModel) {
    await this.blogService.validateBlogUser(blogId, req.user.userId)
    return await this.blogQueryRepository.getBannedUsersForBlog(params, blogId)
  }
  
  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Put(':userId/ban')
  async banOrUnbanUserForBlog(@Param('userId', UserIdValidationPipe) userId: string, @Body() banInfo: BanUserForBlogInputModel, @Req() req: AccessTokenVrifyModel) {
    const userLogin = (await this.userQueryRepository.getUsergByIdNoView(userId)).login
    const result = await this.blogService.banOrUnbanUserForBlog(userLogin, userId, req.user.userId, banInfo)
    return result
  }
}