import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Comment, CommentDocument } from "../comments/models/schemas/Comment";
import { Post, PostDocument } from "./models/schemas/Post";

@Injectable()
export class PostRepository {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>,
  @InjectModel(Comment.name) private commentModel: Model<CommentDocument>){}

  async addPost(post: Post): Promise<PostDocument>{
    const newPost = new this.postModel(post)
    const save = (await newPost.save()).toJSON()
    return save
  }

  async createComment(comment: Comment){
    const newComment = new this.commentModel(comment)
    await newComment.save()
    return newComment
  }

  async deletePostById(id: string): Promise<boolean> {
    const result = await this.postModel.findByIdAndDelete(id)
    return !!result
  }

  async updatePostById(post: PostDocument): Promise<Post> {
    const save = (await post.save()).toJSON()
    return save
  }

  async deletePostsTesting(): Promise<boolean> {
    const result = await this.postModel.deleteMany({})
    return !!result
  }

  async savePost(post: PostDocument) {
    await post.save()
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