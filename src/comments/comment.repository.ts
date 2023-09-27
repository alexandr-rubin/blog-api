import { Injectable } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, DeleteResult, Repository } from "typeorm";
import { CommentLike } from "./models/schemas/CommentLike";
import { CommentEntity } from "./entities/comment.entity";
import { CommentLikesAndDislikesEntity } from "./entities/comment-likes-and-dislikes";

@Injectable()
export class CommentRepository {
  constructor(@InjectRepository(CommentEntity) private readonly commentRepository: Repository<CommentEntity>, @InjectDataSource() protected dataSource: DataSource,
  @InjectRepository(CommentLikesAndDislikesEntity) private readonly commentLikesAndDislikesRepository: Repository<CommentLikesAndDislikesEntity>){}

  async deleteCommentById(id: string): Promise<DeleteResult> {
    // await this.dataSource.query(`
    // DELETE FROM public."CommentLikesAndDislikes"
    // WHERE "commentId" = $1
    // `,[id])

    await this.commentLikesAndDislikesRepository
    .createQueryBuilder()
    .delete()
    .where('"commentId" = :id', { id: id })
    .execute();

    // return await this.dataSource.query(`
    // DELETE FROM public."Comments"
    // WHERE id = $1
    // `,[id])
    return await this.commentRepository.delete(id)
  }

  async updateCommentById(comment: CommentEntity): Promise<CommentEntity> {
    // const result = await this.commentModel.findByIdAndUpdate(id, post)
    // return !!result
    // return await this.dataSource.query(`
    // UPDATE public."Comments"
    // SET 
    // content = $1
    // WHERE id = $2
    // `, [comment.content, id])
    return await this.commentRepository.save(comment)
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
    // return await this.dataSource.query(`
    // UPDATE public."Comments"
    // SET
    //   "likesAndDislikesCount" = jsonb_set(
    //     "likesAndDislikesCount",
    //     '{likesCount}',
    //     (COALESCE("likesAndDislikesCount"->>'likesCount'::text, '0')::int + 1)::text::jsonb
    //   )
    // WHERE "id" = $1`, [commentId])
    await this.commentRepository
      .createQueryBuilder()
      .update()
      .set({
        likesAndDislikesCount: () => `"likesAndDislikesCount" || jsonb_build_object('likesCount', COALESCE("likesAndDislikesCount"->>'likesCount', '0')::int + 1)`,
      })
      .where('id = :commentId', { commentId })
      .execute()
  }

  async incDisLike(commentId: string){
    // return await this.dataSource.query(`
    // UPDATE public."Comments"
    // SET
    //   "likesAndDislikesCount" = jsonb_set(
    //     "likesAndDislikesCount",
    //     '{dislikesCount}',
    //     (COALESCE("likesAndDislikesCount"->>'dislikesCount'::text, '0')::int + 1)::text::jsonb
    //   )
    // WHERE "id" = $1`, [commentId])
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
    //await this.commentModel.updateOne({_id: commentId}, {$inc: {'likesAndDislikesCount.likesCount': -1} })
    // return await this.dataSource.query(`
    // UPDATE public."Comments"
    // SET
    //   "likesAndDislikesCount" = jsonb_set(
    //     "likesAndDislikesCount",
    //     '{likesCount}',
    //     (COALESCE("likesAndDislikesCount"->>'likesCount'::text, '0')::int - 1)::text::jsonb
    //   )
    // WHERE "id" = $1`, [commentId])
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
    // return await this.dataSource.query(`
    // UPDATE public."Comments"
    // SET
    //   "likesAndDislikesCount" = jsonb_set(
    //     "likesAndDislikesCount",
    //     '{dislikesCount}',
    //     (COALESCE("likesAndDislikesCount"->>'dislikesCount'::text, '0')::int - 1)::text::jsonb
    //   )
    // WHERE "id" = $1`, [commentId])
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
    // return await this.dataSource.query(`
    // UPDATE public."CommentLikesAndDislikes"
    // SET
    //   "likeStatus" = $1
    // WHERE "commentId" = $2 AND "userId" = $3`,
    // [
    //   likeStatus, commentId, userId
    // ])

    return await this.commentLikesAndDislikesRepository.update( { commentId: commentId, userId: userId }, {likeStatus: likeStatus})
  }

  async updateFirstLike(comment: CommentLike) {
    // await comment.save()
    // return await this.dataSource.query(`
    //   INSERT INTO public."CommentLikesAndDislikes"(
    //     id, "userId", "addedAt", "likeStatus", "commentId")
    //     VALUES (uuid_generate_v4(), $1, $2, $3, $4)`, [comment.userId, comment.addedAt, comment.likeStatus, commentId])
    return (await this.commentLikesAndDislikesRepository.save(comment)).id
  }
}