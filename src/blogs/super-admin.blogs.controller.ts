import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { BlogService } from "./blog.service";
import { QueryParamsModel } from "../models/PaginationQuery";
import { BlogQueryRepository } from "./blog.query-repository";
import { BasicAuthGuard } from "../guards/basic-auth.guard";
import { UserQueryRepository } from "../users/user.query-repository";
import { BlogIdValidationPipe } from "../validation/pipes/blog-Id-validation.pipe";
import { UserIdValidationPipe } from "../validation/pipes/user-Id-validation.pipe";
import { HttpStatusCode } from "../helpers/httpStatusCode";
import { BanBlogInputModel } from "./models/input/BanBlogInputModel";
import { AccessTokenVrifyModel } from "../models/Auth";
import { PostQueryRepository } from "../posts/post.query-repository";
import { BlogInputModel } from "./models/input/BlogInputModel";
import { PostForSpecBlogInputModel } from "../posts/models/input/PostForSpecBlog";
import { PostService } from "../posts/post.service";
import { PostIdValidationPipe } from "../validation/pipes/post-Id-validation.pipe";

@UseGuards(BasicAuthGuard)
@Controller('sa/blogs')
export class SuperAdminBlogsController {
  constructor(private readonly blogQueryRepository: BlogQueryRepository, private readonly blogService: BlogService,
    private readonly userQueryRepository: UserQueryRepository,
    //// simplify
    private readonly postQueryRepository: PostQueryRepository, private readonly postService: PostService){}

  @Get()
  async getBlogs(@Query() params: QueryParamsModel) {
    const blogs = await this.blogQueryRepository.getSuperAdminBlogs(params)
    // rename method
    // раскомментить после удаления симпл. подумать если null то не обязательно ошибка. ведь супер анмин содает с налом
    // await this.userQueryRepository.getUsersForAdminBlogs(blogs.items)
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

  /////////////////////////////////// simplify

  @Get('/comments')
  async getComments(@Query() params: QueryParamsModel, @Req() req: AccessTokenVrifyModel) {
    const blogIdArray = await this.blogQueryRepository.getBlogsIds(req.user.userId)
    const bannedUserIds = await this.userQueryRepository.getBannedUsersId()
    return await this.postQueryRepository.getCommentsForBlogs(params, blogIdArray, req.user.userId, bannedUserIds)
  }

  @HttpCode(HttpStatusCode.CREATED_201)
  @Post()
  async createBlog(@Body() blog: BlogInputModel) {
    return await this.blogService.addBlog(blog, null)
  }

  @HttpCode(HttpStatusCode.CREATED_201)
  @Post(':blogId/posts')
  async createPostForSecificBlog(@Param('blogId', BlogIdValidationPipe) blogId: string, @Body() post: PostForSpecBlogInputModel) {
    const result = await this.blogService.addPostForSpecificBlog(blogId, post, null)

    return result
  }

  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Delete(':blogId')
  async deleteBlogById(@Param('blogId', BlogIdValidationPipe) id: string) {
    return await this.blogService.deleteBlogById(id, null)
  }

  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Put(':blogId')
  async updateBlogById(@Param('blogId', BlogIdValidationPipe) id: string, @Body() blog: BlogInputModel) {
    return await this.blogService.updateBlogById(id, blog, null)
  }

  @Get(':blogId/posts')
  async getPostsForSpecifyBlog(@Query() params: QueryParamsModel, @Param('blogId', BlogIdValidationPipe) blogId: string) {
    // kak сделать валидацию userId
    await this.blogService.validateBlogUser(blogId, null)
    const bannedUserIds = await this.userQueryRepository.getBannedUsersId()
    return await this.postQueryRepository.getPostsForSpecifiedBlog(blogId, params, null, bannedUserIds)
  }

  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Put(':blogId/posts/:postId')
  async updatePostById(@Param('blogId', BlogIdValidationPipe) blogId: string, @Param('postId', PostIdValidationPipe) postId: string, @Body() post: PostForSpecBlogInputModel) {
    // create validation guard/pipe
    await this.blogService.validateBlogUser(blogId, null)
    return await this.postService.updatePostById(postId, post, blogId) 
  }

  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Delete(':blogId/posts/:postId')
  async deletePostForSpecifyBlog(@Param('blogId', BlogIdValidationPipe) blogId: string, @Param('postId', PostIdValidationPipe) postId: string) {
    // create validation guard/pipe
    await this.blogService.validateBlogUser(blogId, null)
    return await this.postService.deletePostById(postId, blogId) 
  }
}