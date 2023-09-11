import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CommentInputModel } from "./models/input/CommentInputModel";
import { Comment, CommentDocument } from "./models/schemas/Comment";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { UUID } from "crypto";
import { CommentLike } from "./models/schemas/CommentLike";

@Injectable()
export class CommentRepository {
  constructor(@InjectModel(Comment.name) private commentModel: Model<CommentDocument>, @InjectDataSource() protected dataSource: DataSource){}

  async deleteCommentById(id: string): Promise<boolean> {
    // const result = await this.commentModel.findByIdAndDelete(id)
    // return !!result
    await this.dataSource.query(`
    DELETE FROM public."CommentLikesAndDislikes"
    WHERE "commentId" = $1
    `,[id])
    return await this.dataSource.query(`
    DELETE FROM public."Comments"
    WHERE id = $1
    `,[id])
  }

  async updateCommentById(id: string, comment: CommentInputModel): Promise<boolean> {
    // const result = await this.commentModel.findByIdAndUpdate(id, post)
    // return !!result
    return await this.dataSource.query(`
    UPDATE public."Comments"
    SET 
    content = $1
    WHERE id = $2
    `, [comment.content, id])
  }

  async deleteCommentTesting(): Promise<boolean> {
    // const result = await this.commentModel.deleteMany({})
    // return !!result
    await this.dataSource.query(`
    DELETE FROM public."CommentLikesAndDislikes"`)
    return await this.dataSource.query(`
    DELETE FROM public."Comments"`)
  }

  async incLike(commentId: string){
    // await this.commentModel.updateOne({_id: commentId}, {$inc: {'likesAndDislikesCount.likesCount': 1} })
    return await this.dataSource.query(`
    UPDATE public."Comments"
    SET
      "likesAndDislikesCount" = jsonb_set(
        "likesAndDislikesCount",
        '{likesCount}',
        (COALESCE("likesAndDislikesCount"->>'likesCount'::text, '0')::int + 1)::text::jsonb
      )
    WHERE "id" = $1`, [commentId])
  }

  async incDisLike(commentId: string){
    // await this.commentModel.updateOne({_id: commentId}, {$inc: {'likesAndDislikesCount.dislikesCount': 1} })
    return await this.dataSource.query(`
    UPDATE public."Comments"
    SET
      "likesAndDislikesCount" = jsonb_set(
        "likesAndDislikesCount",
        '{dislikesCount}',
        (COALESCE("likesAndDislikesCount"->>'dislikesCount'::text, '0')::int + 1)::text::jsonb
      )
    WHERE "id" = $1`, [commentId])
  }

  async decLike(commentId: string){
    //await this.commentModel.updateOne({_id: commentId}, {$inc: {'likesAndDislikesCount.likesCount': -1} })
    return await this.dataSource.query(`
    UPDATE public."Comments"
    SET
      "likesAndDislikesCount" = jsonb_set(
        "likesAndDislikesCount",
        '{likesCount}',
        (COALESCE("likesAndDislikesCount"->>'likesCount'::text, '0')::int - 1)::text::jsonb
      )
    WHERE "id" = $1`, [commentId])
  }

  async decDisLike(commentId: string){
    // await this.commentModel.updateOne({_id: commentId}, {$inc: {'likesAndDislikesCount.dislikesCount': -1} })
    return await this.dataSource.query(`
    UPDATE public."Comments"
    SET
      "likesAndDislikesCount" = jsonb_set(
        "likesAndDislikesCount",
        '{dislikesCount}',
        (COALESCE("likesAndDislikesCount"->>'dislikesCount'::text, '0')::int - 1)::text::jsonb
      )
    WHERE "id" = $1`, [commentId])
  }

  async updateCommentLikeStatus(likeStatus: string, commentId: string, userId: string) {
    // comment.markModified('likesAndDislikes')
    // await comment.save()
    return await this.dataSource.query(`
    UPDATE public."CommentLikesAndDislikes"
    SET
      "likeStatus" = $1
    WHERE "commentId" = $2 AND "userId" = $3`,
    [
      likeStatus, commentId, userId
    ])
  }

  async updateFirstLike(comment: CommentLike, commentId: UUID) {
    // await comment.save()
    return await this.dataSource.query(`
      INSERT INTO public."CommentLikesAndDislikes"(
        id, "userId", "addedAt", "likeStatus", "commentId")
        VALUES (uuid_generate_v4(), $1, $2, $3, $4)`, [comment.userId, comment.addedAt, comment.likeStatus, commentId])
  }
}