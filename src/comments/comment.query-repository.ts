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
    // const comment = await this.commentModel.findById(commentId, { __v: false, postId: false }).lean()
    const comment: SQLComment[] = await this.dataSource.query(`
    SELECT * FROM public."Comments"
    WHERE id = $1
    `, [commentId])
    if (!comment[0] || bannedUserIds.includes(comment[0].commentatorInfo.userId)){
      throw new NotFoundException('Comment not found')
    }
    const commentLikes = await this.getCommentLikesAndDislikesById(comment[0].id)
    const like = commentLikes.find(like => like.userId === userId && !bannedUserIds.includes(like.userId))
    // const like = await this.commentLikeModel.findOne({commentId: commentId , userId: userId}).lean()
    const likeStatus = like === undefined ? LikeStatuses.None : like.likeStatus
    // 
    const filteredLikesAndDislikes = commentLikes
    .filter(element => !bannedUserIds.includes(element.userId))
    const likesCount = filteredLikesAndDislikes.filter(element => element.likeStatus === LikeStatuses.Like).length
    const dislikesCount = filteredLikesAndDislikes.filter(element => element.likeStatus === LikeStatuses.Dislike).length

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { likesAndDislikesCount, ...rest } = {...comment[0], commentatorInfo: {userId: comment[0].commentatorInfo.userId, userLogin: comment[0].commentatorInfo.userLogin},
    likesInfo: {likesCount: likesCount, dislikesCount: dislikesCount, myStatus: likeStatus}}
    return rest
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