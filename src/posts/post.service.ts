import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PostRepository } from "./post.repository";
import { LikeStatuses } from "../helpers/likeStatuses";
import { BlogQueryRepository } from "../blogs/blog.query-repository";
import { PostQueryRepository } from "./post.query-repository";
import { CommentViewModel } from "../comments/models/view/CommentViewModel";
import { Comment } from "src/comments/models/schemas/Comment";
import { PostInputModel } from "./models/input/Post";
import { PostViewModel } from "./models/view/Post";
import { Post } from "./models/schemas/Post";
import { PostForSpecBlogInputModel } from "./models/input/PostForSpecBlog";

@Injectable()
export class PostService {///////////
  constructor(private postRepository: PostRepository, private blogQueryRepository: BlogQueryRepository, private postQueryRepository: PostQueryRepository){}

  async addPost(post: PostInputModel): Promise<PostViewModel>{
    //
    const blog = await this.blogQueryRepository.getBlogById(post.blogId)
    if(!blog){
      throw new NotFoundException('Blog is not found')
    }
    const newPost: Post = {...post, blogName: blog.name, createdAt: new Date().toISOString(),
    likesAndDislikesCount: { likesCount: 0, dislikesCount: 0}, likesAndDislikes: []}
    const savedPost = await this.postRepository.addPost(newPost)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { __v, _id, likesAndDislikesCount, likesAndDislikes, ...result } = {id: savedPost._id.toString(), ...savedPost, extendedLikesInfo: { likesCount: 0, dislikesCount: 0, myStatus: 'None', newestLikes: [/*{ addedAt: '', login: '', userId: ''}*/]}}
    return result
  }

  async deletePostById(postId: string, blogId: string): Promise<boolean> {
    const post = await this.postQueryRepository.getPostgByIdNoView(postId)
    if(post.blogId !== blogId){
      throw new ForbiddenException('Incorrect blog id')
    }
    const isDeleted = await this.postRepository.deletePostById(postId)
    if(!isDeleted){
      throw new NotFoundException()
    }
    return isDeleted
  }

  async updatePostById(postId: string, newPost: PostForSpecBlogInputModel, blogId: string): Promise<Post> {
    // вынести из квери репо поиск документа?
    const post = await this.postQueryRepository.getPostgByIdNoView(postId)
    if(post.blogId !== blogId){
      throw new ForbiddenException('Incorrect blog id')
    }
    post.title = newPost.title
    post.shortDescription = newPost.shortDescription;
    post.content = newPost.content;
    const isUpdated = await this.postRepository.updatePostById(post)
    if(!isUpdated){
      throw new NotFoundException()
    }
    return isUpdated
  }

  async deletePostsTesting(): Promise<boolean> {
    const result = await this.postRepository.deletePostsTesting()
    return result
  }

  async createComment(userId: string, userLogin: string, content: string, pId: string): Promise<CommentViewModel | null> {
    const post = await this.postQueryRepository.getPostgByIdNoView(pId)
    const bannedUser = await this.blogQueryRepository.getSingleBannedUserForBlog(userId, post.blogId)
    if(bannedUser && bannedUser.isBanned === true){
      throw new ForbiddenException()
    }
    // у сблога список бан. если там есть юзер id то ошибка
    const comment: Comment = {content: content, commentatorInfo: {userId: userId, userLogin: userLogin}, createdAt: new Date().toISOString(), postId: pId,
    likesAndDislikesCount: {likesCount: 0, dislikesCount: 0}, likesAndDislikes: []}

    const savedComment = (await this.postRepository.createComment(comment)).toJSON()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {postId, _id, __v, likesAndDislikesCount, likesAndDislikes, ...result} = 
    ({id: savedComment._id, ...savedComment, commentatorInfo: 
    {userId: savedComment.commentatorInfo.userId, userLogin: savedComment.commentatorInfo.userLogin}, 
    likesInfo: {likesCount: savedComment.likesAndDislikesCount.likesCount, 
    dislikesCount: savedComment.likesAndDislikesCount.dislikesCount , myStatus: LikeStatuses.None}})

    return result
  }

  // private async firstLike(likeStatus: string, userId: string, post: PostDocument, login: string) {
  //   if(likeStatus === LikeStatuses.None){
  //     return true
  //   }
  //   post.likesAndDislikes.push({userId: userId, login: login, addedAt: new Date().toISOString(), likeStatus: likeStatus})
  //   await this.postRepository.savePost(post)
  //   if(likeStatus === LikeStatuses.Like){
  //     await this.postRepository.incLike(post.id)
  //   }
  //   else{
  //     await this.postRepository.incDisLike(post.id)
  //   }
  //   return true
  // }

  // private async updateNoneLikeStatus(likeLikeStatus: string, likeStatus: string, postId: string, userId: string) {
  //   if(likeLikeStatus === LikeStatuses.Like) {
  //     await this.postRepository.updateNoneLikeStatusLike(likeStatus, postId, userId)
  //   }
  //   else if(likeLikeStatus === LikeStatuses.Dislike){
  //     await this.postRepository.updateNoneLikeStatusDislike(likeStatus, postId, userId)
  //   }
  //   return true
  // }

  // private async incPostLikeOrDislike(likeStatus: string, postId: string) {
  //   if(likeStatus === LikeStatuses.None){
  //     return
  //   }
  //   if(likeStatus === LikeStatuses.Like){
  //     await this.postRepository.incLike(postId)
  //   }
  //   else{
  //     await this.postRepository.incDisLike(postId)
  //   }
  // }

  // async updatePostLikeStatus(postId: string, likeStatus: string, userId:string, login: string): Promise<boolean> {
  //   const post = await this.postQueryRepository.getPostgByIdNoView(postId)
  //   if(!post){
  //     throw new NotFoundException()
  //   }

  //   const like = post.likesAndDislikes.find(likeOrDislike => likeOrDislike.userId === userId)

  //   if(!like){
  //     return await this.firstLike(likeStatus, userId, post, login)
  //   }
  //   if(like.likeStatus === likeStatus){
  //     return true
  //   }
  //   if(likeStatus === LikeStatuses.None){
  //     return await this.updateNoneLikeStatus(like.likeStatus, likeStatus, postId, userId)
  //   }
  //   if(like.likeStatus !== likeStatus){
  //     if(like.likeStatus === LikeStatuses.None){
  //       await this.incPostLikeOrDislike(likeStatus, postId)
  //     }
  //     else if(likeStatus === LikeStatuses.Like){
  //       await this.postRepository.incLike(postId)
  //       await this.postRepository.decDisLike(postId)
  //     }
  //     else{
  //       await this.postRepository.decLike(postId)
  //       await this.postRepository.incDisLike(postId)
  //     }

  //     await this.postRepository.updatePostLikeStatus(postId, likeStatus, userId)

  //     return true
  //   }

  //   return true
  // }
}