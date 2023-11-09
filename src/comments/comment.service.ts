import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CommentQueryRepository } from "./comment.query-repository";
import { CommentRepository } from "./comment.repository";
import { CommentInputModel } from "./models/input/CommentInputModel";
import { CommentEntity } from "./entities/comment.entity";
import { DeleteResult } from "typeorm";

@Injectable()
export class CommentService {
  constructor(private commentRepository: CommentRepository, private commentQueryRepository: CommentQueryRepository){}

  async deleteCommentById(id: string, userId: string): Promise<DeleteResult> {
    const comment = await this.commentQueryRepository.getCommentByIdNoView(id)
    if(comment && comment.userId !== userId){
      throw new ForbiddenException()
    }
    
    const isDeleted = await this.commentRepository.deleteCommentById(id)
    if(isDeleted.affected === 0){
      throw new NotFoundException()
    }
    return isDeleted
  }

  async updateCommentById(id: string, newComment: CommentInputModel, userId: string): Promise<CommentEntity> {
    const comment = await this.commentQueryRepository.getCommentByIdNoView(id)
    if(comment && comment.userId !== userId){
      throw new ForbiddenException()
    }
    comment.content = newComment.content
    const updatedComment = await this.commentRepository.updateCommentById(comment)
    if(!updatedComment){
      throw new NotFoundException()
    }
    return updatedComment
  }

  async deleteCommentTesting(): Promise<boolean> {
    const result = await this.commentRepository.deleteCommentTesting()
    return result
  }
}