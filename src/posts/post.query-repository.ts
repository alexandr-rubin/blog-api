import { Injectable, NotFoundException } from "@nestjs/common";
import { Paginator } from "../models/Paginator";
import { QueryParamsModel } from "../models/PaginationQuery";
import { createPaginationQuery } from "../helpers/pagination";
import { LikeStatuses } from "../helpers/likeStatuses";
import { CommentViewModel } from "../comments/models/view/CommentViewModel";
import { PostViewModel } from "./models/view/Post";
import { PostLike } from "./models/schemas/Post";
import { CommentLike } from "../comments/models/schemas/CommentLike";
import { DataSource, In, Not, Repository } from "typeorm";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { PostEntity } from "./entities/post.entity";
import { PostLikesAndDislikesEntity } from "./entities/post-likes-and-dislikes.entity";
import { CommentEntity } from "../comments/entities/comment.entity";
import { CommentLikesAndDislikesEntity } from "../comments/entities/comment-likes-and-dislikes";

@Injectable()
export class PostQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource, @InjectRepository(PostEntity) private readonly postRepository: Repository<PostEntity>,
  @InjectRepository(PostLikesAndDislikesEntity) private readonly postLikesAndDislikesRepository: Repository<PostLikesAndDislikesEntity>,
  @InjectRepository(CommentEntity) private readonly commentRepository: Repository<CommentEntity>,
  @InjectRepository(CommentLikesAndDislikesEntity) private readonly commentLikesAndDislikesRepository: Repository<CommentLikesAndDislikesEntity>){}

  async getPosts(params: QueryParamsModel, userId: string, bannedUserIds: string[], bannedBlogsIds: string[]): Promise<Paginator<PostViewModel>> {
    const query = createPaginationQuery(params)
    const skip = (query.pageNumber - 1) * query.pageSize
    const posts = await this.postRepository
    .createQueryBuilder('post')
    .select()
    .where({
      blogId: Not(In(bannedBlogsIds))
    })
    .orderBy(`post.${query.sortBy} COLLATE "C"`, query.sortDirection === 'asc' ? 'ASC' : 'DESC')
    .skip(skip)
    .take(query.pageSize)
    .getMany()

    const count = await this.countAllPosts()

    const result = Paginator.createPaginationResult(count, query, posts)

    return await this.editPostToViewModel(result, userId, bannedUserIds)
  }

  async getPostgById(postId: string, userId: string, bannedUserIds: string[], bannedBlogsIds: string[]): Promise<PostViewModel | null> {
    const post = await this.postRepository.findOne({
      where: {
        id: postId,
        blogId: Not(In(bannedBlogsIds))
      }
    })

    if(!post){
      throw new NotFoundException()
    }
    const postLikesAndDislikes = await this.getPostLikesAndDislikesById(postId)
    const like = postLikesAndDislikes.find(like => like.userId === userId && !bannedUserIds.includes(like.userId))
    const likeStatus = like === undefined ? LikeStatuses.None : like.likeStatus
    const newestLikes = postLikesAndDislikes
    .filter((element) => element.likeStatus === 'Like' && !bannedUserIds.includes(element.userId))
    .slice(-3)
    .map(({ ...rest }) => {return {...rest, likeStatus: undefined}})
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())

    const filteredLikesAndDislikes = this.filterLikesAndDislikes(postLikesAndDislikes, bannedUserIds)
    const likesCount = filteredLikesAndDislikes.likesCount
    const dislikesCount = filteredLikesAndDislikes.dislikesCount

    const rest = {...post, extendedLikesInfo: {likesCount: likesCount, dislikesCount: dislikesCount, 
    myStatus: likeStatus, newestLikes: newestLikes }, likesAndDislikesCount: undefined, likesAndDislikes: undefined}

    return rest
  }

  public async editPostToViewModel(post: Paginator<PostEntity>, userId: string, bannedUserIds: string[]): Promise<Paginator<PostViewModel>>  {
    const newArray: Paginator<PostViewModel> = {
      ...post,
      items: post.items.map(({...rest }) => {
        return {
          ...rest,
          extendedLikesInfo: {
            likesCount: 0,
            dislikesCount: 0,
            myStatus: LikeStatuses.None.toString(),
            newestLikes: []
          },
          likesAndDislikesCount: undefined
        }
      })
    }
    for(let i = 0; i < newArray.items.length; i++){
      const postLikesAndDislikes = await this.getPostLikesAndDislikesById(post.items[i].id)
      const filteredLikesAndDislikes = this.filterLikesAndDislikes(postLikesAndDislikes, bannedUserIds)
      const likesCount = filteredLikesAndDislikes.likesCount
      const dislikesCount = filteredLikesAndDislikes.dislikesCount

      newArray.items[i].extendedLikesInfo.likesCount = likesCount
      newArray.items[i].extendedLikesInfo.dislikesCount = dislikesCount

      const newestLikes = postLikesAndDislikes
      .filter((element) => element.likeStatus === 'Like' && !bannedUserIds.includes(element.userId))
      .slice(-3)
      .map(({ ...rest }) => {return {...rest, likeStatus: undefined}})
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      newArray.items[i].extendedLikesInfo.newestLikes = newestLikes
      const status = postLikesAndDislikes.find(element => element.userId === userId)
      if(status){
          newArray.items[i].extendedLikesInfo.myStatus = status.likeStatus
      }
    }
    return newArray 
  }

  async getPostLikesAndDislikesById(postId: string){
    const likesAndDislikes = await this.postLikesAndDislikesRepository
    .createQueryBuilder('likes')
    .select(['likes.userId', 'likes.login', 'likes.addedAt', 'likes.likeStatus'])
    .where('likes."postId" = :postId', { postId: postId })
    .getMany()

    return likesAndDislikes
  }
  
  async getCommentsForSpecifiedPost(postId: string, params: QueryParamsModel, userId: string, bannedUserIds: string[]): Promise<Paginator<CommentViewModel> | null>{
    const isFinded = await this.getPostgByIdNoView(postId)
    if(!isFinded){
      throw new NotFoundException()
    }
    const query = createPaginationQuery(params)
    const skip = (query.pageNumber - 1) * query.pageSize
    const comments: CommentEntity[] = await this.commentRepository.createQueryBuilder('c')
      .where('c.postId = :postId', { postId })
      .orderBy(`c.${query.sortBy}`, query.sortDirection === 'asc' ? 'ASC' : 'DESC')
      .offset(skip)
      .limit(query.pageSize)
      .getMany()
      
    const count = await this.commentRepository.createQueryBuilder('c')
      .where('c.postId = :postId', { postId })
      .getCount()

    const result = Paginator.createPaginationResult(count, query, comments)

    return await this.editCommentToViewModel(result, userId, bannedUserIds)
  }

  // query repo shouldnt return document
  async getPostgByIdNoView(postId: string): Promise<PostEntity | null> {
    const post = await this.postRepository.findOneBy({id: postId})
    if(!post){
      return null
    }
    return post
  }

  async getPostsForSpecifiedBlog(blogId: string, params: QueryParamsModel, userId: string | null, bannedUserIds: string[]): Promise<Paginator<PostViewModel>>{
    const query = createPaginationQuery(params)
    const skip = (query.pageNumber - 1) * query.pageSize

    const posts = await this.postRepository
    .createQueryBuilder('post')
    .select()
    .where('post."blogId" = :blogId', { blogId: blogId })
    .orderBy(`post.${query.sortBy} COLLATE "C"`, query.sortDirection === 'asc' ? 'ASC' : 'DESC')
    .skip(skip)
    .take(query.pageSize)
    .getMany()

    const count = await this.countPostsForSpecBlog(blogId)

    const transformedPosts = posts.map(({ ...rest }) => ({ id: rest.id, ...rest }))
    const result = Paginator.createPaginationResult(count, query, transformedPosts)
    return this.editPostToViewModel(result, userId, bannedUserIds)
  }
  
  async getCommentsForBlogs(params: QueryParamsModel, blogIdArray: string[], userId: string, bannedUserIds: string[]): Promise<Paginator<CommentViewModel>> {
    const postsArray = await this.getPostssForBlogs(blogIdArray)
    const postIdArray = postsArray.map(({...post}) => (post.id.toString()))
    const query = createPaginationQuery(params)
    const skip = (query.pageNumber - 1) * query.pageSize

    const comments: CommentEntity[] = await this.commentRepository
    .createQueryBuilder("comment")
    .select()
    .where({
      postId: In(postIdArray),
      userId: Not(In(bannedUserIds))})
    .orderBy(`comment.${query.sortBy} COLLATE "C"`, query.sortDirection === 'asc' ? 'ASC' : 'DESC')
    .skip(skip)
    .take(query.pageSize)
    .getMany()


    const count = await this.commentRepository.createQueryBuilder("comment")
    .select()
    .where({
      postId: In(postIdArray),
      userId: Not(In(bannedUserIds))})
    .getCount()

    const mappedComments = comments.map(comment => {
      // if !post
      const post = postsArray.find(post => post.id.toString() === comment.postId)

      delete comment.postId
      
      const postInfo = {
        id: post.id,
        title: post.title,
        blogId: post.blogId,
        blogName: post.blogName
      }

      return {...comment, postInfo}
    })

    const result = Paginator.createPaginationResult(count, query, mappedComments)

    return await this.editCommentToViewModel(result, userId, bannedUserIds)
  }

  private async getPostssForBlogs(blogIdArray: string[]): Promise<PostEntity[]> {
    const posts = await this.postRepository
    .createQueryBuilder("post")
    .where("post.blogId IN (:...ids)", { ids: blogIdArray })
    .getMany()

    return posts
  }

  private async editCommentToViewModel(comment: Paginator<CommentEntity>, userId: string, bannedUserIds: string[]): Promise<Paginator<CommentViewModel>> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const newArray = {...comment, items: comment.items.map(({userId, userLogin, postId, likesAndDislikesCount, ...rest }) => ({
        ...rest, commentatorInfo: {userId: userId, userLogin: userLogin},
        likesInfo: { likesCount: 0,  dislikesCount: 0, myStatus: LikeStatuses.None.toString() }
    }))}
    for(let i = 0; i < newArray.items.length; i++){
      const commentLikesAndDislikes = await this.getCommentLikesAndDislikesById(comment.items[i].id)
      const filteredLikesAndDislikes = this.filterLikesAndDislikes(commentLikesAndDislikes, bannedUserIds)
      const likesCount = filteredLikesAndDislikes.likesCount
      const dislikesCount = filteredLikesAndDislikes.dislikesCount

      newArray.items[i].likesInfo.likesCount = likesCount
      newArray.items[i].likesInfo.dislikesCount = dislikesCount

      const status = commentLikesAndDislikes.find(element => element.userId === userId)
      if(status){
        newArray.items[i].likesInfo.myStatus = status.likeStatus
      }
    }
    return newArray
  }

  async getCommentLikesAndDislikesById(commentId: string) {
    const likesAndDislikes = await this.commentLikesAndDislikesRepository.createQueryBuilder('likeOrDislike')
    .select(['likeOrDislike.userId', 'likeOrDislike.addedAt', 'likeOrDislike.likeStatus'])
    .where('likeOrDislike.commentId = :commentId', {commentId: commentId})
    .getMany()

    return likesAndDislikes
  }

  private filterLikesAndDislikes(likesAndDislikes: PostLike[] | CommentLike[], bannedUserIds: string[]) {
    const filteredLikesAndDislikes = likesAndDislikes
    .filter(element => !bannedUserIds.includes(element.userId))
    const likesCount = filteredLikesAndDislikes.filter(element => element.likeStatus === LikeStatuses.Like).length
    const dislikesCount = filteredLikesAndDislikes.filter(element => element.likeStatus === LikeStatuses.Dislike).length

    return { likesCount: likesCount, dislikesCount: dislikesCount }
  }

  private async countPostsForSpecBlog(blogId: string): Promise<number> {

    const builder = this.postRepository.createQueryBuilder('post')
      .select('COUNT(*)', 'count')
      .where('post."blogId" = :blogId', {
        blogId: blogId,
      })

    const result = await builder.getRawOne()
    return +result.count
  }

  private async countAllPosts(): Promise<number> {

    const builder = this.postRepository.createQueryBuilder('post')
      .select('COUNT(*)', 'count')

    const result = await builder.getRawOne()
    return +result.count
  }
}