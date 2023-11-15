import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { NotFoundException } from "@nestjs/common";
import { LikeStatuses } from "../../helpers/likeStatuses";
import { CommentRepository } from "../comment.repository";
import { CommentQueryRepository } from "../comment.query-repository";
import { CommentEntity } from "../entities/comment.entity";
import { DataSource } from "typeorm";
import { CommentLikesAndDislikesEntity } from "../entities/comment-likes-and-dislikes";

export class UpdateCommentLikeStatusCommand {
  constructor(public commentId: string, public likeStatus: string, public userId:string) {}
}

@CommandHandler(UpdateCommentLikeStatusCommand)
export class UpdateCommentLikeStatusUseCase implements ICommandHandler<UpdateCommentLikeStatusCommand> {
  constructor(private commentRepository: CommentRepository, private commentQueryRepository: CommentQueryRepository, private dataSource: DataSource){}

  async execute(command: UpdateCommentLikeStatusCommand): Promise<boolean> {
    const comment = await this.commentQueryRepository.getCommentByIdNoView(command.commentId)
    if(!comment){
      throw new NotFoundException()
    }

    const commentLikes = await this.commentQueryRepository.getCommentLikesAndDislikesById(comment.id)

    const like = commentLikes.find(likeOrDislike => likeOrDislike.userId === command.userId)

    if(!like){
      if(command.likeStatus === LikeStatuses.None){
        return true
      }
      return await this.firstLike(comment, command.likeStatus, command.userId)
    }
    if(like.likeStatus === command.likeStatus){
      return true
    }
    if(command.likeStatus === LikeStatuses.None){
      const qr = this.dataSource.createQueryRunner()
      await qr.connect()
      await qr.startTransaction()

      try{
        if(like.likeStatus === LikeStatuses.Like){
          await this.commentRepository.decLike(command.commentId, qr)
        }
        else if(like.likeStatus === LikeStatuses.Dislike){
          await this.commentRepository.decDisLike(command.commentId, qr)
        }
  
        await qr.manager.getRepository(CommentLikesAndDislikesEntity).update( { commentId: command.commentId, userId: command.userId }, {likeStatus: command.likeStatus})
  
        await qr.commitTransaction()

        return true
      }
      catch(error) {
        console.log(error)
        await qr.rollbackTransaction()
      }
      finally {
        await qr.release()
      }
    }
    if(like.likeStatus !== command.likeStatus){
      const qr = this.dataSource.createQueryRunner()
      await qr.connect()
      await qr.startTransaction()

      try{
        if(like.likeStatus === LikeStatuses.None){
          if(command.likeStatus === LikeStatuses.Like){
            await this.commentRepository.incLike(command.commentId, qr)
          }
          else{
            await this.commentRepository.incDisLike(command.commentId, qr)
          }
        }
        else if(command.likeStatus === LikeStatuses.Like){
            await this.commentRepository.incLike(command.commentId, qr)
            await this.commentRepository.decDisLike(command.commentId, qr)
        }
        else{
            await this.commentRepository.decLike(command.commentId, qr)
            await this.commentRepository.incDisLike(command.commentId, qr)
        }
        
        await qr.manager.getRepository(CommentLikesAndDislikesEntity).update( { commentId: command.commentId, userId: command.userId }, {likeStatus: command.likeStatus})
  
        await qr.commitTransaction()

        return true
      }
      catch(error) {
        console.log(error)
        await qr.rollbackTransaction()
      }
      finally {
        await qr.release()
      }
    }

    return true
  }

  private async firstLike(comment: CommentEntity, likeStatus: string, userId: string) {
    const qr = this.dataSource.createQueryRunner()
    await qr.connect()
    await qr.startTransaction()

    try{
      // add type
      const commentLike = {userId: userId, addedAt: new Date().toISOString(), likeStatus: likeStatus, commentId: comment.id}
      await qr.manager.getRepository(CommentLikesAndDislikesEntity).save(commentLike)
      if(likeStatus === LikeStatuses.Like){
        await this.commentRepository.incLike(comment.id, qr)
      }
      else{
        await this.commentRepository.incDisLike(comment.id, qr)
      }

      await qr.commitTransaction()
      
      return true
    }
    catch(error) {
      console.log(error)
      await qr.rollbackTransaction()
    }
    finally {
      await qr.release()
    }
  }
}