import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { NotFoundException } from "@nestjs/common";
import { LikeStatuses } from "../../helpers/likeStatuses";
import { PostQueryRepository } from "../post.query-repository";
import { PostRepository } from "../post.repository";
import { PostEntity } from "../entities/post.entity";
import { DataSource } from "typeorm";
import { PostLikesAndDislikesEntity } from "../entities/post-likes-and-dislikes.entity";

export class UpdatePostLikeStatusCommand {
  constructor(public postId: string, public likeStatus: string, public userId:string, public login: string) {}
}

@CommandHandler(UpdatePostLikeStatusCommand)
export class UpdatePostLikeStatusUseCase implements ICommandHandler<UpdatePostLikeStatusCommand> {
  constructor(private postRepository: PostRepository, private postQueryRepository: PostQueryRepository, private dataSource: DataSource){}
  async execute(command: UpdatePostLikeStatusCommand): Promise<boolean> {
    const post = await this.postQueryRepository.getPostgByIdNoView(command.postId)
    if(!post){
      throw new NotFoundException()
    }

    const postLikesAndDislikes = await this.postQueryRepository.getPostLikesAndDislikesById(post.id)

    const like = postLikesAndDislikes.find(likeOrDislike => likeOrDislike.userId === command.userId)

    if(!like){
      return await this.firstLike(command.likeStatus, command.userId, post, command.login)
    }
    if(like.likeStatus === command.likeStatus){
      return true
    }
    if(command.likeStatus === LikeStatuses.None){
      return await this.updateNoneLikeStatus(like.likeStatus, command.likeStatus, command.postId, command.userId)
    }
    if(like.likeStatus !== command.likeStatus){
      const qr = this.dataSource.createQueryRunner()
      await qr.connect()
      await qr.startTransaction()

      try{
        if(like.likeStatus === LikeStatuses.None){
          if(command.likeStatus === LikeStatuses.Like){
            await this.postRepository.incLike(command.postId, qr)
          }
          else{
            await this.postRepository.incDisLike(command.postId, qr)
          }
        }
        else if(command.likeStatus === LikeStatuses.Like){
          await this.postRepository.incLike(command.postId, qr)
          await this.postRepository.decDisLike(command.postId, qr)
        }
        else{
          await this.postRepository.decLike(command.postId, qr)
          await this.postRepository.incDisLike(command.postId, qr)
        }
  
        await qr.manager.getRepository(PostLikesAndDislikesEntity).update( { postId: command.postId, userId: command.userId }, {likeStatus: command.likeStatus})

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

  private async firstLike(likeStatus: string, userId: string, post: PostEntity, login: string) {
    if(likeStatus === LikeStatuses.None){
      return true
    }
    
    const qr = this.dataSource.createQueryRunner()
    await qr.connect()
    await qr.startTransaction()

    try{
      const postLike = {userId: userId, login: login, addedAt: new Date().toISOString(), likeStatus: likeStatus, postId: post.id}
      await qr.manager.getRepository(PostLikesAndDislikesEntity).save(postLike)
      if(likeStatus === LikeStatuses.Like){
        await this.postRepository.incLike(post.id, qr)
      }
      else{
        await this.postRepository.incDisLike(post.id, qr)
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

  private async updateNoneLikeStatus(likeLikeStatus: string, likeStatus: string, postId: string, userId: string) {
    const qr = this.dataSource.createQueryRunner()
    await qr.connect()
    await qr.startTransaction()

    try{
      if(likeLikeStatus === LikeStatuses.Like) {
        await this.postRepository.decLike(postId, qr)
      }
      else if(likeLikeStatus === LikeStatuses.Dislike){
        await this.postRepository.decDisLike(postId, qr)
        
      }

      await qr.manager.getRepository(PostLikesAndDislikesEntity).update( { postId: postId, userId: userId }, {likeStatus: likeStatus})

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