import { Body, Controller, Get, HttpCode, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { HttpStatusCode } from "../helpers/httpStatusCode";
import { PostService } from "./post.service";
import { PostQueryRepository } from "./post.query-repository";
import { QueryParamsModel } from "../models/PaginationQuery";
import { PostIdValidationPipe } from "../validation/pipes/post-Id-validation.pipe";
import { AccessTokenVrifyModel } from "../models/Auth";
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
    return await this.postQueryRepository.getPosts(params, userId, bannedUserIds, bannedBlogsIds)
  }

  @Get(':postId')
  async getPostById(@Param('postId', PostIdValidationPipe) id: string, @Req() req: Request) {
    let userId = ''
    const bearer = req.headers.authorization
    if(bearer){
      userId = await this.jwtAuthService.verifyToken(bearer)
    }
    const bannedUserIds = await this.userQueryRepository.getBannedUsersId()
    const bannedBlogsIds = await this.blogQueryRepository.getBannedBlogsId()
    return await this.postQueryRepository.getPostgById(id, userId, bannedUserIds, bannedBlogsIds)
  }

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
    return await this.postQueryRepository.getCommentsForSpecifiedPost(postId, params, userId, bannedUserIds)
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Put('/:postId/like-status')
  async updateLikeStatus(@Param('postId', PostIdValidationPipe) postId: string, @Body() likeStatus: likeStatusValidation, @Req() req: AccessTokenVrifyModel) {
    return await this.commandBus.execute(new UpdatePostLikeStatusCommand(postId, likeStatus.likeStatus, req.user.userId, req.user.login))
  }
}