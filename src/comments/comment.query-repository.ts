import { Injectable, NotFoundException } from "@nestjs/common";
import { LikeStatuses } from "../helpers/likeStatuses";
import { CommentViewModel } from "./models/view/CommentViewModel";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { CommentEntity } from "./entities/comment.entity";
import { CommentLikesAndDislikesEntity } from "./entities/comment-likes-and-dislikes";

@Injectable()
export class CommentQueryRepository {
  constructor(@InjectRepository(CommentEntity) private readonly commentRepository: Repository<CommentEntity>, @InjectDataSource() protected dataSource: DataSource,
  @InjectRepository(CommentLikesAndDislikesEntity) private readonly commentLikesAndDislikesRepository: Repository<CommentLikesAndDislikesEntity>){}

  async getCommentById(commentId: string, userId: string, bannedUserIds: string[]): Promise<CommentViewModel> {
    const comment: CommentEntity = await this.commentRepository.findOneBy({id: commentId})
    if (!comment || bannedUserIds.includes(comment.userId)){
      throw new NotFoundException('Comment not found')
    }
    const commentLikes = await this.getCommentLikesAndDislikesById(comment.id)
    const like = commentLikes.find(like => like.userId === userId && !bannedUserIds.includes(like.userId))
    const likeStatus = like === undefined ? LikeStatuses.None : like.likeStatus
    const filteredLikesAndDislikes = commentLikes
    .filter(element => !bannedUserIds.includes(element.userId))
    const likesCount = filteredLikesAndDislikes.filter(element => element.likeStatus === LikeStatuses.Like).length
    const dislikesCount = filteredLikesAndDislikes.filter(element => element.likeStatus === LikeStatuses.Dislike).length

    const result = {...comment, commentatorInfo: {userId: comment.userId, userLogin: comment.userLogin},
    likesInfo: {likesCount: likesCount, dislikesCount: dislikesCount, myStatus: likeStatus}, postId: undefined, likesAndDislikesCount: undefined}
    return result
  }

  async getCommentByIdNoView(commentId: string): Promise<CommentEntity | null> {
    const comment: CommentEntity = await this.commentRepository.findOneBy({id: commentId})
    if(!comment){
      return null
    }
    return comment
  }

  async getCommentLikesAndDislikesById(commentId: string){
    const likesAndDislikes = await this.commentLikesAndDislikesRepository
    .createQueryBuilder('likes')
    .select(['likes.userId','likes.addedAt', 'likes.likeStatus'])
    .where('likes."commentId" = :commentId', { commentId: commentId })
    .getMany()

    return likesAndDislikes
  }
}