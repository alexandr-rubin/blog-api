import { Body, Controller, Get, HttpCode, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { HttpStatusCode } from "../helpers/httpStatusCode";
import { PostService } from "./post.service";
import { PostQueryRepository } from "./post.query-repository";
import { QueryParamsModel } from "../models/PaginationQuery";
//import { BlogIdForPostValidationPipe } from "../validation/pipes/body-blog-id-validation.pipe";
import { PostIdValidationPipe } from "../validation/pipes/post-Id-validation.pipe";
import { AccessTokenVrifyModel } from "../authorization/models/input/Auth";
import { Request } from 'express'
import { JwtAuthService } from "../domain/JWT.service";
import { likeStatusValidation } from "../validation/likeStatus";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { CommentInputModel } from "../comments/models/input/CommentInputModel";
import { UserQueryRepository } from "../users/user.query-repository";
import { RolesGuard } from "../guards/roles.guard";
import { Roles } from "../decorators/roles.decorator";
import { UserRoles } from "../helpers/userRoles";
import { CommandBus } from "@nestjs/cqrs";
import { UpdatePostLikeStatusCommand } from "./use-cases/update-post-like-staus-use-case";
import { BlogQueryRepository } from "../blogs/blog.query-repository";

@UseGuards(RolesGuard)
@Roles(UserRoles.Guest)
@Controller('posts')
export class PostsController {
  constructor(private readonly postService: PostService, private readonly postQueryRepository: PostQueryRepository, private readonly jwtAuthService: JwtAuthService,
    private readonly userQueryRepository: UserQueryRepository, private readonly blogQueryRepository: BlogQueryRepository, private commandBus: CommandBus){}
  @Get()
  async getPosts(@Query() params: QueryParamsModel, @Req() req: Request) {
    let userId = ''
    const bearer = req.headers.authorization
    if(bearer){
      userId = await this.jwtAuthService.verifyToken(bearer)
    }
    const bannedUserIds = await this.userQueryRepository.getBannedUsersId()
    const bannedBlogsIds = await this.blogQueryRepository.getBannedBlogsId()
    // add userID
    return await this.postQueryRepository.getPosts(params, userId, bannedUserIds, bannedBlogsIds)
  }

  // @UseGuards(BasicAuthGuard)
  // @HttpCode(HttpStatusCode.CREATED_201)
  // @Post()
  // async createPost(@Body(/*BlogIdForPostValidationPipe*/) post: PostInputModel) {
  //   return await this.postService.addPost(post)
  // }

  // @UseGuards(BasicAuthGuard)
  // @HttpCode(HttpStatusCode.NO_CONTENT_204)
  // @Delete(':postId')
  // async deletePostById(@Param('postId', PostIdValidationPipe) id: string) {
  //   return await this.postService.deletePostById(id)
  // }

  @Get(':postId')
  async getPostById(@Param('postId', PostIdValidationPipe) id: string, @Req() req: Request) {
    let userId = ''
    const bearer = req.headers.authorization
    if(bearer){
      userId = await this.jwtAuthService.verifyToken(bearer)
    }
    const bannedUserIds = await this.userQueryRepository.getBannedUsersId()
    const bannedBlogsIds = await this.blogQueryRepository.getBannedBlogsId()
    // userID
    return await this.postQueryRepository.getPostgById(id, userId, bannedUserIds, bannedBlogsIds)
  }

  // @UseGuards(BasicAuthGuard)
  // @HttpCode(HttpStatusCode.NO_CONTENT_204)
  // @Put(':postId')
  // async updatePostById(@Param('postId', PostIdValidationPipe) id: string, @Body() post: PostInputModel) {
  //   return await this.postService.updatePostById(id, post) 
  // }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatusCode.CREATED_201)
  @Post(':postId/comments')
  async createComment(@Param('postId', PostIdValidationPipe) postId: string, @Body() content: CommentInputModel, @Req() req: AccessTokenVrifyModel) {
    return await this.postService.createComment(req.user.userId, req.user.login, content.content, postId)
  }

  @Get(':postId/comments')
  async getCommentsForSpecifedPost(@Param('postId', PostIdValidationPipe) postId: string, @Query() params: QueryParamsModel,@Req() req: Request) {
    let userId = ''
    const bearer = req.headers.authorization
    if(bearer){
      userId = await this.jwtAuthService.verifyToken(bearer)
    }
    const bannedUserIds = await this.userQueryRepository.getBannedUsersId()
    // userId
    return await this.postQueryRepository.getCommentsForSpecifiedPost(postId, params, userId, bannedUserIds)
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Put('/:postId/like-status')
  async updateLikeStatus(@Param('postId', PostIdValidationPipe) postId: string, @Body() likeStatus: likeStatusValidation, @Req() req: AccessTokenVrifyModel) {
    return await this.commandBus.execute(new UpdatePostLikeStatusCommand(postId, likeStatus.likeStatus, req.user.userId, req.user.login))
  }
}