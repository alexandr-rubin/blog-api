import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { NotFoundException } from "@nestjs/common";
import { LikeStatuses } from "../../helpers/likeStatuses";
import { PostDocument } from "../models/schemas/Post";
import { PostQueryRepository } from "../post.query-repository";
import { PostRepository } from "../post.repository";

export class UpdatePostLikeStatusCommand {
  constructor(public postId: string, public likeStatus: string, public userId:string, public login: string) {}
}

@CommandHandler(UpdatePostLikeStatusCommand)
export class UpdatePostLikeStatusUseCase implements ICommandHandler<UpdatePostLikeStatusCommand> {
  constructor(private postRepository: PostRepository, private postQueryRepository: PostQueryRepository){}
  async execute(command: UpdatePostLikeStatusCommand): Promise<boolean> {
    const post = await this.postQueryRepository.getPostgByIdNoView(command.postId)
    if(!post){
      throw new NotFoundException()
    }

    const like = post.likesAndDislikes.find(likeOrDislike => likeOrDislike.userId === command.userId)

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
      if(like.likeStatus === LikeStatuses.None){
        await this.incPostLikeOrDislike(command.likeStatus, command.postId)
      }
      else if(command.likeStatus === LikeStatuses.Like){
        await this.postRepository.incLike(command.postId)
        await this.postRepository.decDisLike(command.postId)
      }
      else{
        await this.postRepository.decLike(command.postId)
        await this.postRepository.incDisLike(command.postId)
      }

      await this.updatePostLikeStatus(command.postId, command.likeStatus, command.userId)

      return true
    }

    return true
  }

  private async firstLike(likeStatus: string, userId: string, post: PostDocument, login: string) {
    if(likeStatus === LikeStatuses.None){
      return true
    }
    post.likesAndDislikes.push({userId: userId, login: login, addedAt: new Date().toISOString(), likeStatus: likeStatus})
    await this.postRepository.savePost(post)
    if(likeStatus === LikeStatuses.Like){
      await this.postRepository.incLike(post.id)
    }
    else{
      await this.postRepository.incDisLike(post.id)
    }
    return true
  }

  private async updateNoneLikeStatus(likeLikeStatus: string, likeStatus: string, postId: string, userId: string) {
    if(likeLikeStatus === LikeStatuses.Like) {
      // await this.postRepository.updateNoneLikeStatusLike(likeStatus, postId, userId)
      await this.postRepository.decLike(postId)
      await this.updatePostLikeStatus(postId, likeStatus, userId)
    }
    else if(likeLikeStatus === LikeStatuses.Dislike){
      // await this.postRepository.updateNoneLikeStatusDislike(likeStatus, postId, userId)
      await this.postRepository.decDisLike(postId)
      await this.updatePostLikeStatus(postId, likeStatus, userId)
    }
    return true
  }

  private async incPostLikeOrDislike(likeStatus: string, postId: string) {
    if(likeStatus === LikeStatuses.None){
      return
    }
    if(likeStatus === LikeStatuses.Like){
      await this.postRepository.incLike(postId)
    }
    else{
      await this.postRepository.incDisLike(postId)
    }
  }

  private async updatePostLikeStatus(postId: string, likeStatus: string, userId: string) {
    const post = await this.postRepository.getPostDocument(postId)
    if(!post){
      throw new NotFoundException('Post is not found')
    }
    const like = post.likesAndDislikes.find(likeOrDislike => likeOrDislike.userId === userId)
    like.likeStatus = likeStatus
    await this.postRepository.updatePostLikeStatus(post)
  }
}