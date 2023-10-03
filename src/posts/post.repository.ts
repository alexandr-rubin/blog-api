import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Post, PostDocument, PostLike } from "./models/schemas/Post";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, DeleteResult, Repository } from "typeorm";
import { SQLCommentInputModel } from "../comments/models/input/SQLCommentInputModel";
import { PostEntity } from "./entities/post.entity";
import { PostLikesAndDislikesEntity } from "./entities/post-likes-and-dislikes.entity";
import { CommentEntity } from "../comments/entities/comment.entity";

@Injectable()
export class PostRepository {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>, @InjectDataSource() protected dataSource: DataSource,
  @InjectRepository(PostEntity) private readonly postRepository: Repository<PostEntity>, 
  @InjectRepository(PostLikesAndDislikesEntity) private readonly postLikesAndDislikesRepository: Repository<PostLikesAndDislikesEntity>,
  @InjectRepository(CommentEntity) private readonly commentRepository: Repository<CommentEntity>){}

  async addPost(post: Post): Promise<PostDocument>{
    const newPost = new this.postModel(post)
    const save = (await newPost.save()).toJSON()
    return save
  }

  async createComment(comment: SQLCommentInputModel){
    return (await this.commentRepository.save(comment)).id
  }

  private async deleteCommentsForPost(postId: string) {
    const comments = await this.dataSource.query(`
    SELECT id FROM public."Comments"
    WHERE "postId" = $1
    `, [postId])

    const commentIds = comments.map(row => row.id)

    await this.dataSource.query(`
    DELETE FROM public."CommentLikesAndDislikes"
    WHERE "commentId" = ANY($1)
    `, [commentIds])

    await this.dataSource.query(`
    DELETE FROM public."Comments"
    WHERE "postId" = $1
    `, [postId])
  }

  async deletePostById(id: string): Promise<DeleteResult> {
    await this.deleteCommentsForPost(id)
    await this.postLikesAndDislikesRepository
    .createQueryBuilder()
    .delete()
    .where('"postId" = :id', { id: id })
    .execute()
    return await this.postRepository.delete(id)
  }

  async updatePostById(post: PostEntity): Promise<PostEntity> {
    return await this.postRepository.save(post)
  }

  async deletePostsTesting(): Promise<boolean> {
    await this.dataSource.query(`
    DELETE FROM public."PostLikesAndDislikes"
    `)
    return await this.dataSource.query(`
    DELETE FROM public."Posts"
    `)
  }

  async updateFirstLike(postLike: PostLike) {
    return (await this.postLikesAndDislikesRepository.save(postLike)).id
  }

  async incLike(postId: string){
    await this.postRepository
      .createQueryBuilder()
      .update()
      .set({
        likesAndDislikesCount: () => `jsonb_set("likesAndDislikesCount", '{likesCount}', COALESCE(("likesAndDislikesCount"->>'likesCount')::int + 1, '0')::text::jsonb)`
      })
      .where('id = :postId', { postId })
      .execute()
  }

  async incDisLike(postId: string){
    await this.postRepository
      .createQueryBuilder()
      .update()
      .set({
        likesAndDislikesCount: () => `"likesAndDislikesCount" || jsonb_build_object('dislikesCount', COALESCE("likesAndDislikesCount"->>'dislikesCount', '0')::int + 1)`,
      })
      .where('id = :postId', { postId })
      .execute()
  }

  async decLike(postId: string){
    await this.commentRepository
      .createQueryBuilder()
      .update()
      .set({
        likesAndDislikesCount: () => `"likesAndDislikesCount" || jsonb_build_object('likesCount', COALESCE("likesAndDislikesCount"->>'likesCount', '0')::int - 1)`,
      })
      .where('id = :postId', { postId })
      .execute()
  }

  async decDisLike(postId: string){
    await this.postRepository
      .createQueryBuilder()
      .update()
      .set({
        likesAndDislikesCount: () => `"likesAndDislikesCount" || jsonb_build_object('dislikesCount', COALESCE("likesAndDislikesCount"->>'dislikesCount', '0')::int - 1)`,
      })
      .where('id = :postId', { postId })
      .execute();
  }

  async updatePostLikeStatus(postId: string, userId: string, likeStatus: string) {
    return await this.postLikesAndDislikesRepository.update( { postId: postId, userId: userId }, {likeStatus: likeStatus})
  }
}