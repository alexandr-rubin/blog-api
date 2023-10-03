import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PostRepository } from "./post.repository";
import { LikeStatuses } from "../helpers/likeStatuses";
import { BlogQueryRepository } from "../blogs/blog.query-repository";
import { PostQueryRepository } from "./post.query-repository";
import { CommentViewModel } from "../comments/models/view/CommentViewModel";
import { PostInputModel } from "./models/input/Post";
import { PostViewModel } from "./models/view/Post";
import { Post } from "./models/schemas/Post";
import { PostForSpecBlogInputModel } from "./models/input/PostForSpecBlog";
import { SQLCommentInputModel } from "../comments/models/input/SQLCommentInputModel";
import { PostEntity } from "./entities/post.entity";
import { DeleteResult } from "typeorm";

@Injectable()
export class PostService {
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

  async deletePostById(postId: string, blogId: string): Promise<DeleteResult> {
    const post = await this.postQueryRepository.getPostgByIdNoView(postId)
    if(post.blogId !== blogId){
      throw new ForbiddenException('Incorrect blog id')
    }
    const isDeleted = await this.postRepository.deletePostById(postId)
    if(isDeleted.affected === 0){
      throw new NotFoundException()
    }
    return isDeleted
  }

  async updatePostById(postId: string, newPost: PostForSpecBlogInputModel, blogId: string): Promise<PostEntity> {
    // вынести из квери репо поиск документа?
    const post: PostEntity = await this.postQueryRepository.getPostgByIdNoView(postId)
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
    const comment: SQLCommentInputModel = {content: content, commentatorInfo: {userId: userId, userLogin: userLogin}, createdAt: new Date().toISOString(), postId: pId,
    likesAndDislikesCount: {likesCount: 0, dislikesCount: 0}}

    const commentId = await this.postRepository.createComment(comment)
    const result = 
    ({id: commentId, ...comment, commentatorInfo: 
    {userId: comment.commentatorInfo.userId, userLogin: comment.commentatorInfo.userLogin}, 
    likesInfo: {likesCount: comment.likesAndDislikesCount.likesCount, 
    dislikesCount: comment.likesAndDislikesCount.dislikesCount , myStatus: LikeStatuses.None}, postId: undefined, likesAndDislikesCount: undefined})

    return result
  }
}