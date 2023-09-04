import { Body, Controller, Delete, Get, HttpCode, Param, Put, Req, UseGuards } from "@nestjs/common";
import { HttpStatusCode } from "../helpers/httpStatusCode";
import { CommentQueryRepository } from "./comment.query-repository";
import { CommentService } from "./comment.service";
import { CommentIdValidationPipe } from "../validation/pipes/comment-Id-validation.pipe";
import { Request } from 'express'
import { AccessTokenVrifyModel } from "../authorization/models/input/Auth";
import { JwtAuthService } from "../domain/JWT.service";
import { likeStatusValidation } from "../validation/likeStatus";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { CommentInputModel } from "./models/input/CommentInputModel";
import { UserQueryRepository } from "../users/user.query-repository";
import { Roles } from "../decorators/roles.decorator";
import { UserRoles } from "../helpers/userRoles";
import { RolesGuard } from "../guards/roles.guard";
import { CommandBus } from "@nestjs/cqrs";
import { UpdateCommentLikeStatusCommand } from "./use-cases/update-comment-like-use-case";

// comments 403?
UseGuards(RolesGuard)
@Roles(UserRoles.Guest)
@Controller('comments')
export class CommentController {
  constructor(private readonly commentQueryRepository: CommentQueryRepository, private readonly commentService: CommentService, private readonly jwtAuthService: JwtAuthService,
    private readonly userQueryRepository: UserQueryRepository, private commandBus: CommandBus){}
  @Get(':commentId')
  async getCommentById(@Param('commentId', CommentIdValidationPipe) id: string, @Req() req: Request) {
    let userId = ''
    const bearer = req.headers.authorization
    if(bearer){
      userId = await this.jwtAuthService.verifyToken(bearer)
    }

    const bannedUserIds = await this.userQueryRepository.getBannedUsersId()

    return await this.commentQueryRepository.getCommentById(id, userId, bannedUserIds)
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Delete(':commentId')
  async deleteCommentById(@Param('commentId', CommentIdValidationPipe) commentId: string, @Req() req: Request) {
    let userId = ''
    const bearer = req.headers.authorization
    if(bearer){
      userId = await this.jwtAuthService.verifyToken(bearer)
    }
    return await this.commentService.deleteCommentById(commentId, userId)
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Put(':commentId')
  async updateCommentById(@Param('commentId', CommentIdValidationPipe) commentId: string, @Body() comment: CommentInputModel, @Req() req: Request) {
    let userId = ''
    const bearer = req.headers.authorization
    if(bearer){
      userId = await this.jwtAuthService.verifyToken(bearer)
    }
    return await this.commentService.updateCommentById(commentId, comment, userId) 
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Put('/:commentId/like-status')
  async updateLikeStatus(@Param('commentId', CommentIdValidationPipe) commentId: string, @Body() likeStatus: likeStatusValidation, @Req() req: AccessTokenVrifyModel) {
    //return await this.commentService.updateCommentLike(commentId, likeStatus.likeStatus, req.user.userId)
    return await this.commandBus.execute(new UpdateCommentLikeStatusCommand(commentId, likeStatus.likeStatus, req.user.userId))
  }
}