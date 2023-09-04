import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { QueryParamsModel } from "../models/PaginationQuery";
import { BlogQueryRepository } from "./blog.query-repository";
import { BlogIdValidationPipe } from "../validation/pipes/blog-Id-validation.pipe";
import { PostQueryRepository } from "../posts/post.query-repository";
import { UserQueryRepository } from "../users/user.query-repository";
import { Roles } from "../decorators/roles.decorator";
import { UserRoles } from "../helpers/userRoles";
import { RolesGuard } from "../guards/roles.guard";

UseGuards(RolesGuard)
@Roles(UserRoles.Guest)
@Controller('blogs')
export class PublicBlogsController {
  constructor(private readonly blogQueryRepository: BlogQueryRepository, private readonly postQueryRepository: PostQueryRepository,
    private readonly userQueryRepository: UserQueryRepository){}

  @Get()
  async getBlogs(@Query() params: QueryParamsModel) {
    return await this.blogQueryRepository.getBlogs(params, null)
  }

  @Get(':blogId/posts')
  async getPostsForSpecifyBlog(@Query() params: QueryParamsModel, @Param('blogId', BlogIdValidationPipe) blogId: string) {
    const bannedUserIds = await this.userQueryRepository.getBannedUsersId()
    return await this.postQueryRepository.getPostsForSpecifiedBlog(blogId, params, null, bannedUserIds)
  }

  @Get(':blogId')
  async getBlogById(@Param('blogId', BlogIdValidationPipe) id: string) {
    return await this.blogQueryRepository.getBlogById(id)
  }
}