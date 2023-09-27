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
    // const newComment = new this.commentModel(comment)
    // await newComment.save()
    // return newComment
    // const newBlog = await this.dataSource.query(`
    // INSERT INTO public."Comments"(
    //   id, content, "commentatorInfo", "createdAt", "postId", "likesAndDislikesCount")
    //   VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)
    //   RETURNING id
    // `,
    // [
    //   comment.content,
    //   comment.commentatorInfo,
    //   comment.createdAt,
    //   comment.postId,
    //   comment.likesAndDislikesCount
    // ])

    // return newBlog[0].id
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
    // const result = await this.postModel.findByIdAndDelete(id)
    // return !!result
    await this.deleteCommentsForPost(id)
    // await this.dataSource.query(`
    // DELETE FROM public."PostLikesAndDislikes"
    // WHERE "postId" = $1
    // `,[id])
    await this.postLikesAndDislikesRepository
    .createQueryBuilder()
    .delete()
    .where('"postId" = :id', { id: id })
    .execute();
    // const post = await this.dataSource.query(`
    // DELETE FROM public."Posts"
    // WHERE id = $1
    // `, [id])
    // return post[0]
    return await this.postRepository.delete(id)
  }

  async updatePostById(post: PostEntity): Promise<PostEntity> {
    // const save = (await post.save()).toJSON()
    // return save
    // return await this.dataSource.query(`
    // UPDATE public."Posts"
    // SET
    //   title = $1, "shortDescription" = $2, content = $3
    //   WHERE "id" = $4`,
    // [
    //   post.title, post.shortDescription, post.content, post.id
    // ])

    return await this.postRepository.save(post)
  }

  async deletePostsTesting(): Promise<boolean> {
    // const result = await this.postModel.deleteMany({})
    // return !!result
    await this.dataSource.query(`
    DELETE FROM public."PostLikesAndDislikes"
    `)
    return await this.dataSource.query(`
    DELETE FROM public."Posts"
    `)
  }

  async updateFirstLike(postLike: PostLike) {
    // return await this.dataSource.query(`
    // INSERT INTO public."PostLikesAndDislikes"(
    //   id, "userId", login, "addedAt", "likeStatus", "postId")
    //   VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)`, [postLike.userId, postLike.login, postLike.addedAt, postLike.likeStatus, postId])
    return (await this.postLikesAndDislikesRepository.save(postLike)).id
  }
  
  // async updateNoneLikeStatusLike(likeStatus:string, postId: string, userId: string){
  //   await this.decLike(postId)
  //   await this.updatePostLikeStatus(postId, likeStatus, userId)

  //   return true
  // }

  // async updateNoneLikeStatusDislike(likeStatus:string, postId: string, userId: string){
  //   await this.decDisLike(postId)
  //   await this.updatePostLikeStatus(postId, likeStatus, userId)

  //   return true
  // }

  // async updateLikeStatus(likeLikeStatus: string, likeStatus: string, postId: string, userId: string) {
  //   if(likeLikeStatus === LikeStatuses.None){
  //     if(likeStatus === LikeStatuses.Like){
  //       await this.incLike(postId)
  //     }
  //     else{
  //       await this.incDisLike(postId)
  //     }
  //   }
  //   else if(likeStatus === LikeStatuses.Like){
  //       await this.incLike(postId)
  //       await this.decDisLike(postId)
  //   }
  //   else{
  //       await this.decLike(postId)
  //       await this.incDisLike(postId)
  //   }
  //   await this.updatePostLikeStatus(postId, likeStatus, userId)
  //   return true
  // }

  async incLike(postId: string){
    // return await this.dataSource.query(`
    // UPDATE public."Posts"
    // SET
    //   "likesAndDislikesCount" = jsonb_set(
    //     "likesAndDislikesCount",
    //     '{likesCount}',
    //     (COALESCE("likesAndDislikesCount"->>'likesCount'::text, '0')::int + 1)::text::jsonb
    //   )
    // WHERE "id" = $1`, [postId])
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
    // await this.dataSource.query(`
    // UPDATE public."Posts"
    // SET
    //   "likesAndDislikesCount" = jsonb_set(
    //     "likesAndDislikesCount",
    //     '{dislikesCount}',
    //     (COALESCE("likesAndDislikesCount"->>'dislikesCount'::text, '0')::int + 1)::text::jsonb
    //   )
    // WHERE "id" = $1`, [postId])
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
    // await this.dataSource.query(`
    // UPDATE public."Posts"
    // SET
    //   "likesAndDislikesCount" = jsonb_set(
    //     "likesAndDislikesCount",
    //     '{likesCount}',
    //     (COALESCE("likesAndDislikesCount"->>'likesCount'::text, '0')::int - 1)::text::jsonb
    //   )
    // WHERE "id" = $1`, [postId])

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
    // return await this.dataSource.query(`
    // UPDATE public."Posts"
    // SET
    //   "likesAndDislikesCount" = jsonb_set(
    //     "likesAndDislikesCount",
    //     '{dislikesCount}',
    //     (COALESCE("likesAndDislikesCount"->>'dislikesCount'::text, '0')::int - 1)::text::jsonb
    //   )
    // WHERE "id" = $1`, [postId])
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
    // return await this.dataSource.query(`
    // UPDATE public."PostLikesAndDislikes"
    // SET
    //   "likeStatus" = $1
    // WHERE "postId" = $2 AND "userId" = $3`,
    // [
    //   likeStatus, postId, userId
    // ])

    return await this.postLikesAndDislikesRepository.update( { postId: postId, userId: userId }, {likeStatus: likeStatus})
  }

  // async getPostDocument(postId): Promise<PostDocument> {
  //   const post = await this.postModel.findById(postId)

  //   return post
  // }
}