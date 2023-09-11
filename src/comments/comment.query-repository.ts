import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { LikeStatuses } from "../helpers/likeStatuses";
import { Comment, CommentDocument } from "./models/schemas/Comment";
import { CommentViewModel } from "./models/view/CommentViewModel";
import { SQLComment } from "./models/view/SQLCommentViewModel";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { UUID } from "crypto";

@Injectable()
export class CommentQueryRepository {
  constructor(@InjectModel(Comment.name) private commentModel: Model<CommentDocument>, @InjectDataSource() protected dataSource: DataSource){}

  async getCommentById(commentId: string, userId: string, bannedUserIds: string[]): Promise<CommentViewModel> {
    const comment = await this.commentModel.findById(commentId, { __v: false, postId: false }).lean()
    if (!comment || bannedUserIds.includes(comment.commentatorInfo.userId)){
      throw new NotFoundException('Comment not found')
    }
    const like = comment.likesAndDislikes.find(like => like.userId === userId && !bannedUserIds.includes(like.userId))
    // const like = await this.commentLikeModel.findOne({commentId: commentId , userId: userId}).lean()
    const likeStatus = like === undefined ? LikeStatuses.None : like.likeStatus
    // 
    const filteredLikesAndDislikes = comment.likesAndDislikes
    .filter(element => !bannedUserIds.includes(element.userId))
    const likesCount = filteredLikesAndDislikes.filter(element => element.likeStatus === LikeStatuses.Like).length
    const dislikesCount = filteredLikesAndDislikes.filter(element => element.likeStatus === LikeStatuses.Dislike).length

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, likesAndDislikesCount, likesAndDislikes, ...rest } = {...comment, commentatorInfo: {userId: comment.commentatorInfo.userId, userLogin: comment.commentatorInfo.userLogin},
    likesInfo: {likesCount: likesCount, dislikesCount: dislikesCount, myStatus: likeStatus}}
    const id = _id.toString()
    return { id, ...rest }
  }

  async getCommentByIdNoView(commentId: string): Promise<SQLComment | null> {
    // const comment = await this.commentModel.findById(commentId)
    // if (!comment){
    //   return null
    // }
    // return comment
    const comment: SQLComment = await this.dataSource.query(`
    SELECT * FROM public."Comments"
    WHERE id = $1
    `, [commentId])
    if(!comment[0]){
      return null
    }
    return comment[0]
  }

  async getCommentLikesAndDislikesById(commentId: UUID){
    const likesAndDislokes = await this.dataSource.query(`
      SELECT "userId", "addedAt", "likeStatus" FROM public."CommentLikesAndDislikes"
      WHERE "commentId" = $1
    `, [commentId])

    return likesAndDislokes
  }
}