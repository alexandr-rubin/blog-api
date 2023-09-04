import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { HttpStatusCode } from "../helpers/httpStatusCode";
import { BlogService } from "./blog.service";
import { QueryParamsModel } from "../models/PaginationQuery";
import { BlogQueryRepository } from "./blog.query-repository";
import { BlogIdValidationPipe } from "../validation/pipes/blog-Id-validation.pipe";
import { PostQueryRepository } from "../posts/post.query-repository";
import { BlogInputModel } from "./models/input/BlogInputModel";
import { PostForSpecBlogInputModel } from "../posts/models/input/PostForSpecBlog";
import { AccessTokenVrifyModel } from "../authorization/models/input/Auth";
import { PostIdValidationPipe } from "../validation/pipes/post-Id-validation.pipe";
import { PostService } from "../posts/post.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { UserQueryRepository } from "../users/user.query-repository";

@UseGuards(JwtAuthGuard/*, RolesGuard*/)
//@Roles(UserRoles.User)
@Controller('blogger/blogs')
export class BlogsController {
  constructor(private readonly blogService: BlogService,  private readonly postService: PostService, private readonly blogQueryRepository: BlogQueryRepository, 
  private readonly postQueryRepository: PostQueryRepository, private readonly userQueryRepository: UserQueryRepository){}

  @Get()
  async getBlogs(@Query() params: QueryParamsModel, @Req() req: AccessTokenVrifyModel) {
    return await this.blogQueryRepository.getBlogs(params, req.user.userId)
  }

  @Get('/comments')
  async getComments(@Query() params: QueryParamsModel, @Req() req: AccessTokenVrifyModel) {
    const blogIdArray = await this.blogQueryRepository.getBlogsIds(req.user.userId)
    const bannedUserIds = await this.userQueryRepository.getBannedUsersId()
    return await this.postQueryRepository.getCommentsForBlogs(params, blogIdArray, req.user.userId, bannedUserIds)
  }

  @HttpCode(HttpStatusCode.CREATED_201)
  @Post()
  async createBlog(@Body() blog: BlogInputModel, @Req() req: AccessTokenVrifyModel) {
    return await this.blogService.addBlog(blog, req.user.userId)
  }

  @HttpCode(HttpStatusCode.CREATED_201)
  @Post(':blogId/posts')
  async createPostForSecificBlog(@Param('blogId', BlogIdValidationPipe) blogId: string, @Body() post: PostForSpecBlogInputModel, @Req() req: AccessTokenVrifyModel) {
    const result = await this.blogService.addPostForSpecificBlog(blogId, post, req.user.userId)

    return result
  }

  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Delete(':blogId')
  async deleteBlogById(@Param('blogId', BlogIdValidationPipe) id: string, @Req() req: AccessTokenVrifyModel) {
    return await this.blogService.deleteBlogById(id, req.user.userId)
  }

  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Put(':blogId')
  async updateBlogById(@Param('blogId', BlogIdValidationPipe) id: string, @Body() blog: BlogInputModel, @Req() req: AccessTokenVrifyModel) {
    return await this.blogService.updateBlogById(id, blog, req.user.userId)
  }

  @Get(':blogId/posts')
  async getPostsForSpecifyBlog(@Query() params: QueryParamsModel, @Param('blogId', BlogIdValidationPipe) blogId: string, @Req() req: AccessTokenVrifyModel) {
    // kak сделать валидацию userId
    await this.blogService.validateBlogUser(blogId, req.user.userId)
    const bannedUserIds = await this.userQueryRepository.getBannedUsersId()
    return await this.postQueryRepository.getPostsForSpecifiedBlog(blogId, params, req.user.userId, bannedUserIds)
  }

  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Put(':blogId/posts/:postId')
  async updatePostById(@Param('blogId', BlogIdValidationPipe) blogId: string, @Param('postId', PostIdValidationPipe) postId: string, @Body() post: PostForSpecBlogInputModel,
  @Req() req: AccessTokenVrifyModel) {
    // create validation guard/pipe
    await this.blogService.validateBlogUser(blogId, req.user.userId)
    return await this.postService.updatePostById(postId, post, blogId) 
  }

  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Delete(':blogId/posts/:postId')
  async deletePostForSpecifyBlog(@Param('blogId', BlogIdValidationPipe) blogId: string, @Param('postId', PostIdValidationPipe) postId: string, @Req() req: AccessTokenVrifyModel) {
    // create validation guard/pipe
    await this.blogService.validateBlogUser(blogId, req.user.userId)
    return await this.postService.deletePostById(postId, blogId) 
  }
}