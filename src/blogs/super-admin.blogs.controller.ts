import { Body, Controller, Get, HttpCode, Param, Put, Query, UseGuards } from "@nestjs/common";
import { BlogService } from "./blog.service";
import { QueryParamsModel } from "../models/PaginationQuery";
import { BlogQueryRepository } from "./blog.query-repository";
import { BasicAuthGuard } from "../guards/basic-auth.guard";
import { UserQueryRepository } from "../users/user.query-repository";
import { BlogIdValidationPipe } from "../validation/pipes/blog-Id-validation.pipe";
import { UserIdValidationPipe } from "../validation/pipes/user-Id-validation.pipe";
import { HttpStatusCode } from "../helpers/httpStatusCode";
import { BanBlogInputModel } from "./models/input/BanBlogInputModel";

@UseGuards(BasicAuthGuard)
@Controller('sa/blogs')
export class SuperAdminBlogsController {
  constructor(private readonly blogQueryRepository: BlogQueryRepository, private readonly blogService: BlogService,
    private readonly userQueryRepository: UserQueryRepository){}

  @Get()
  async getBlogs(@Query() params: QueryParamsModel) {
    const blogs = await this.blogQueryRepository.getSuperAdminBlogs(params)
    // rename method
    await this.userQueryRepository.getUsersForAdminBlogs(blogs.items)
    return blogs
  }

  @Put(':blogId/bind-with-user/:userId')
  async bindBlogWithUser(@Param('blogId', BlogIdValidationPipe) blogId: string, @Param('userId', UserIdValidationPipe) userId: string) {
    return await this.blogService.bindBlogWithUser(blogId, userId)
  }

  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Put(':blogId/ban')
  async banOrUnbanUserById(@Body() banInfo: BanBlogInputModel, @Param('blogId', BlogIdValidationPipe) blogId: string) {
    return await this.blogService.banOrUnbanBlogById(blogId, banInfo.isBanned)
  }
}