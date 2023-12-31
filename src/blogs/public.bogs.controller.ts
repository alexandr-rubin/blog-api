import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { QueryParamsModel } from "../models/PaginationQuery";
import { BlogQueryRepository } from "./blog.query-repository";
import { BlogIdValidationPipe } from "../validation/pipes/blog-Id-validation.pipe";
import { PostQueryRepository } from "../posts/post.query-repository";
import { UserQueryRepository } from "../users/user.query-repository";
import { Roles } from "../decorators/roles.decorator";
import { UserRoles } from "../helpers/userRoles";
import { RolesGuard } from "../guards/roles.guard";
import { JwtAuthService } from "../domain/JWT.service";
import { Request } from "express";

UseGuards(RolesGuard)
@Roles(UserRoles.Guest)
@Controller('blogs')
export class PublicBlogsController {
  constructor(private readonly blogQueryRepository: BlogQueryRepository, private readonly postQueryRepository: PostQueryRepository,
    private readonly userQueryRepository: UserQueryRepository, private readonly jwtAuthService: JwtAuthService){}

  @Get()
  async getBlogs(@Query() params: QueryParamsModel) {
    return await this.blogQueryRepository.getBlogs(params, null)
  }

  @Get(':blogId/posts')
  async getPostsForSpecifyBlog(@Query() params: QueryParamsModel, @Param('blogId', BlogIdValidationPipe) blogId: string, @Req() req: Request) {
    let userId = ''
    const bearer = req.headers.authorization
    if(bearer){
      userId = await this.jwtAuthService.verifyToken(bearer)
    }
    const bannedUserIds = await this.userQueryRepository.getBannedUsersId()
    return await this.postQueryRepository.getPostsForSpecifiedBlog(blogId, params, userId, bannedUserIds)
  }

  @Get(':blogId')
  async getBlogById(@Param('blogId', BlogIdValidationPipe) id: string) {
    return await this.blogQueryRepository.getBlogById(id)
  }
}