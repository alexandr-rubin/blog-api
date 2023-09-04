import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CommentInputModel } from "./models/input/CommentInputModel";
import { Comment, CommentDocument } from "./models/schemas/Comment";

@Injectable()
export class CommentRepository {
  constructor(@InjectModel(Comment.name) private commentModel: Model<CommentDocument>){}

  async deleteCommentById(id: string): Promise<boolean> {
    const result = await this.commentModel.findByIdAndDelete(id)
    return !!result
  }

  async updateCommentById(id: string, post: CommentInputModel): Promise<boolean> {
    const result = await this.commentModel.findByIdAndUpdate(id, post)
    return !!result
  }

  async deleteCommentTesting(): Promise<boolean> {
    const result = await this.commentModel.deleteMany({})
    return !!result
  }

  async incLike(commentId: string){
    await this.commentModel.updateOne({_id: commentId}, {$inc: {'likesAndDislikesCount.likesCount': 1} })
  }

  async decLike(commentId: string){
    await this.commentModel.updateOne({_id: commentId}, {$inc: {'likesAndDislikesCount.likesCount': -1} })
  }

  async incDisLike(commentId: string){
    await this.commentModel.updateOne({_id: commentId}, {$inc: {'likesAndDislikesCount.dislikesCount': 1} })
  }

  async decDisLike(commentId: string){
    await this.commentModel.updateOne({_id: commentId}, {$inc: {'likesAndDislikesCount.dislikesCount': -1} })
  }

  async updateCommentLikeStatus(comment: CommentDocument) {
    comment.markModified('likesAndDislikes')
    await comment.save()
  }

  async updateFirstLike(comment: CommentDocument) {
    await comment.save()
  }
}