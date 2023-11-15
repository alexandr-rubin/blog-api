import { Injectable } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, DeleteResult, QueryRunner, Repository } from "typeorm";
import { CommentLike } from "./models/schemas/CommentLike";
import { CommentEntity } from "./entities/comment.entity";
import { CommentLikesAndDislikesEntity } from "./entities/comment-likes-and-dislikes";

@Injectable()
export class CommentRepository {
  constructor(@InjectRepository(CommentEntity) private readonly commentRepository: Repository<CommentEntity>, @InjectDataSource() protected dataSource: DataSource,
  @InjectRepository(CommentLikesAndDislikesEntity) private readonly commentLikesAndDislikesRepository: Repository<CommentLikesAndDislikesEntity>){}

  async deleteCommentById(id: string): Promise<DeleteResult> {
    return await this.commentRepository.delete(id)
  }

  async updateCommentById(comment: CommentEntity): Promise<CommentEntity> {
    return await this.commentRepository.save(comment)
  }

  async deleteCommentTesting(): Promise<boolean> {
    await this.dataSource.query(`
    DELETE FROM public."CommentLikesAndDislikes"`)
    return await this.dataSource.query(`
    DELETE FROM public."Comments"`)
  }

  async incLike(commentId: string, qr?: QueryRunner){
    const queryBuilder = qr
      ? qr.manager.getRepository(CommentEntity).createQueryBuilder()
      : this.commentRepository.createQueryBuilder()

    await queryBuilder
      .update()
      .set({
        likesAndDislikesCount: () => `"likesAndDislikesCount" || jsonb_build_object('likesCount', COALESCE("likesAndDislikesCount"->>'likesCount', '0')::int + 1)`,
      })
      .where('id = :commentId', { commentId })
      .execute()
  }

  async incDisLike(commentId: string){
    return await this.commentRepository
      .createQueryBuilder()
      .update()
      .set({
        likesAndDislikesCount: () => `"likesAndDislikesCount" || jsonb_build_object('dislikesCount', COALESCE("likesAndDislikesCount"->>'dislikesCount', '0')::int + 1)`,
      })
      .where('id = :commentId', { commentId })
      .execute()
  }

  async decLike(commentId: string){
    await this.commentRepository
      .createQueryBuilder()
      .update()
      .set({
        likesAndDislikesCount: () => `"likesAndDislikesCount" || jsonb_build_object('likesCount', COALESCE("likesAndDislikesCount"->>'likesCount', '0')::int - 1)`,
      })
      .where('id = :commentId', { commentId })
      .execute()
  }

  async decDisLike(commentId: string){
    await this.commentRepository
      .createQueryBuilder()
      .update()
      .set({
        likesAndDislikesCount: () => `"likesAndDislikesCount" || jsonb_build_object('dislikesCount', COALESCE("likesAndDislikesCount"->>'dislikesCount', '0')::int - 1)`,
      })
      .where('id = :commentId', { commentId })
      .execute();
  }

  async updateCommentLikeStatus(likeStatus: string, commentId: string, userId: string) {
    return await this.commentLikesAndDislikesRepository.update( { commentId: commentId, userId: userId }, {likeStatus: likeStatus})
  }

  async updateFirstLike(comment: CommentLike) {
    return await this.commentLikesAndDislikesRepository.save(comment)
  }
}