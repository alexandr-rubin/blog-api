import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Comment, CommentDocument } from "../comments/models/schemas/Comment";
import { Post, PostDocument } from "./models/schemas/Post";
import { SQLPostViewModel } from "./models/view/SQLPost";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class PostRepository {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>,
  @InjectModel(Comment.name) private commentModel: Model<CommentDocument>, @InjectDataSource() protected dataSource: DataSource){}

  async addPost(post: Post): Promise<PostDocument>{
    const newPost = new this.postModel(post)
    const save = (await newPost.save()).toJSON()
    return save
  }

  async createComment(comment: Comment){
    // const newComment = new this.commentModel(comment)
    // await newComment.save()
    // return newComment
    const newBlog = await this.dataSource.query(`
    INSERT INTO public."Comments"(
      id, content, "commentatorInfo", "createdAt", "postId", "likesAndDislikesCount", "likesAndDislikes")
      VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6)
      RETURNING id
    `,
    [
      comment.content,
      comment.commentatorInfo,
      comment.createdAt,
      comment.postId,
      comment.likesAndDislikesCount,
      comment.likesAndDislikes
    ])

    return newBlog[0].id
  }

  async deletePostById(id: string): Promise<boolean> {
    // const result = await this.postModel.findByIdAndDelete(id)
    // return !!result
    await this.dataSource.query(`
    DELETE FROM public."Comments"
    WHERE "postId" = $1
    `, [id])
    const post = await this.dataSource.query(`
    DELETE FROM public."Posts"
    WHERE id = $1
    `, [id])
    return post[0]
  }

  async updatePostById(post: SQLPostViewModel): Promise<Post> {
    // const save = (await post.save()).toJSON()
    // return save
    return await this.dataSource.query(`
    UPDATE public."Posts"
    SET
      title = $1, "shortDescription" = $2, content = $3
      WHERE "id" = $4`,
    [
      post.title, post.shortDescription, post.content, post.id
    ])
  }

  async deletePostsTesting(): Promise<boolean> {
    // const result = await this.postModel.deleteMany({})
    // return !!result
    return await this.dataSource.query(`
    DELETE FROM public."Posts"
    `)
  }

  async savePost(post: SQLPostViewModel) {
    // await post.save()
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
    await this.postModel.updateOne({_id: postId}, {$inc: {'likesAndDislikesCount.likesCount': 1} })
  }

  async incDisLike(postId: string){
    await this.postModel.updateOne({_id: postId}, {$inc: {'likesAndDislikesCount.dislikesCount': 1} })
  }

  async decLike(postId: string){
    await this.postModel.updateOne({_id: postId}, {$inc: {'likesAndDislikesCount.likesCount': -1} })
  }

  async decDisLike(postId: string){
    await this.postModel.updateOne({_id: postId}, {$inc: {'likesAndDislikesCount.dislikesCount': -1} })
  }

  async updatePostLikeStatus(post: PostDocument) {
    post.markModified('likesAndDislikes')
    await post.save()
  }

  async getPostDocument(postId): Promise<PostDocument> {
    const post = await this.postModel.findById(postId)

    return post
  }
}