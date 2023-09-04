import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CommentQueryRepository } from "./comment.query-repository";
import { CommentRepository } from "./comment.repository";
import { CommentInputModel } from "./models/input/CommentInputModel";

@Injectable()
export class CommentService {
  constructor(private commentRepository: CommentRepository, private commentQueryRepository: CommentQueryRepository){}

  async deleteCommentById(id: string, userId: string): Promise<boolean> {
    const comment = await this.commentQueryRepository.getCommentByIdNoView(id)
    if(comment && comment.commentatorInfo.userId !== userId){
      throw new ForbiddenException()
    }
    
    const isDeleted = await this.commentRepository.deleteCommentById(id)
    if(!isDeleted){
      throw new NotFoundException()
    }
    return isDeleted
  }

  async updateCommentById(id: string, post: CommentInputModel, userId: string): Promise<boolean> {
    const comment = await this.commentQueryRepository.getCommentByIdNoView(id)
    if(comment && comment.commentatorInfo.userId !== userId){
      throw new ForbiddenException()
    }
    const isUpdated = await this.commentRepository.updateCommentById(id, post)
    if(!isUpdated){
      throw new NotFoundException()
    }
    return isUpdated
  }

  async deleteCommentTesting(): Promise<boolean> {
    const result = await this.commentRepository.deleteCommentTesting()
    return result
  }
}