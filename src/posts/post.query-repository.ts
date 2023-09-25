import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Paginator } from "../models/Paginator";
import { QueryParamsModel } from "../models/PaginationQuery";
import { createPaginationQuery } from "../helpers/pagination";
import { LikeStatuses } from "../helpers/likeStatuses";
import { CommentViewModel } from "../comments/models/view/CommentViewModel";
import { Comment, CommentDocument } from "../comments/models/schemas/Comment";
import { PostViewModel } from "./models/view/Post";
import { PostDocument, Post, PostLike } from "./models/schemas/Post";
import { CommentLike } from "../comments/models/schemas/CommentLike";
import { DataSource, Repository } from "typeorm";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { SQLPostViewModel } from "./models/view/SQLPost";
import { UUID } from "crypto";
import { SQLComment } from "../comments/models/view/SQLCommentViewModel";
import { PostEntity } from "./entities/post.entity";

@Injectable()
export class PostQueryRepository {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>, @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  @InjectDataSource() protected dataSource: DataSource, @InjectRepository(PostEntity) private readonly postRepository: Repository<PostEntity>){}

  async getPosts(params: QueryParamsModel, userId: string, bannedUserIds: string[], bannedBlogsIds: string[]): Promise<Paginator<PostViewModel>> {
    // fix
    const query = createPaginationQuery(params)
    const skip = (query.pageNumber - 1) * query.pageSize
    // const filter = {
    //   $and: [
    //     query.searchNameTerm === null ? {} : { name: { $regex: query.searchNameTerm, $options: 'i' } },
    //     { blogId: { $nin: bannedBlogsIds } }
    //   ]
    // }
    // const posts = await this.postModel
    // .find(filter, { __v: false })
    // .sort({ [query.sortBy]: query.sortDirection === 'asc' ? 1 : -1 })
    // .skip(skip).limit(query.pageSize)
    // .lean();
    // const count = await this.postModel.countDocuments(filter)
    //
    // const posts: PostEntity[] = await this.dataSource.query(`
    // SELECT * FROM public."Posts" p
    // ORDER BY p."${query.sortBy}" COLLATE "C" ${query.sortDirection}
    // OFFSET $1
    // LIMIT $2
    // `, [skip, query.pageSize])

    const posts = await this.postRepository
    .createQueryBuilder('post')
    .select()
    .orderBy(`post.${query.sortBy} COLLATE "C"`, query.sortDirection === 'asc' ? 'ASC' : 'DESC')
    .skip(skip)
    .take(query.pageSize)
    .getMany()

    const count = await this.countAllPosts()

    const result = Paginator.createPaginationResult(count, query, posts)

    return await this.editPostToViewModel(result, userId, bannedUserIds)
  }

  async getPostgById(postId: string, userId: string, bannedUserIds: string[], bannedBlogsIds: string[]): Promise<PostViewModel | null> {
    // const post = await this.postModel
    // .findOne({
    //   _id: postId,
    //   blogId: { $nin: bannedBlogsIds }
    // }, { __v: false })
    // const post: SQLPostViewModel = await this.dataSource.query(`
    // SELECT * FROM public."Posts"
    // WHERE id = $1
    // `, [postId])
    const post = await this.postRepository.findOneBy({id: postId})
    if(!post){
      throw new NotFoundException()
    }
    const postLikesAndDislikes = await this.getPostLikesAndDislikesById(postId)
    const like = postLikesAndDislikes.find(like => like.userId === userId && !bannedUserIds.includes(like.userId))
    const likeStatus = like === undefined ? LikeStatuses.None : like.likeStatus
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    //const newestLikes = post.likesAndDislikes.filter((element) => element.likeStatus === 'Like').slice(-3).map((element) => element).map(({ likeStatus, ...rest }) => rest)
    const newestLikes = postLikesAndDislikes
    .filter((element) => element.likeStatus === 'Like' && !bannedUserIds.includes(element.userId))
    .slice(-3)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ likeStatus, ...rest }) => rest)
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      items: post.items.map(({ likesAndDislikesCount, ...rest }) => {
        return {
          ...rest,
          extendedLikesInfo: {
            likesCount: 0,
            dislikesCount: 0,
            myStatus: LikeStatuses.None.toString(),
            newestLikes: []
          }
        };
      })
    };
    for(let i = 0; i < newArray.items.length; i++){
      //
      const postLikesAndDislikes = await this.getPostLikesAndDislikesById(post.items[i].id)
      const filteredLikesAndDislikes = this.filterLikesAndDislikes(postLikesAndDislikes, bannedUserIds)
      const likesCount = filteredLikesAndDislikes.likesCount
      const dislikesCount = filteredLikesAndDislikes.dislikesCount

      newArray.items[i].extendedLikesInfo.likesCount = likesCount
      newArray.items[i].extendedLikesInfo.dislikesCount = dislikesCount

      const newestLikes = postLikesAndDislikes
      .filter((element) => element.likeStatus === 'Like' && !bannedUserIds.includes(element.userId))
      .slice(-3)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ likeStatus, ...rest }) => rest)
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      newArray.items[i].extendedLikesInfo.newestLikes = newestLikes
      // const status = await this.postLikeModel.findOne({createdAt: newArray.items[i].createdAt, userId: userId})
      const status = postLikesAndDislikes.find(element => element.userId === userId)
      if(status){
          newArray.items[i].extendedLikesInfo.myStatus = status.likeStatus
      }
    }
    return newArray 
  }

  async getPostLikesAndDislikesById(postId: string){
    const likesAndDislikes = await this.dataSource.query(`
      SELECT "userId", login, "addedAt", "likeStatus" FROM public."PostLikesAndDislikes"
      WHERE "postId" = $1
    `, [postId])

    return likesAndDislikes
  }
  
  async getCommentsForSpecifiedPost(postId: string, params: QueryParamsModel, userId: string, bannedUserIds: string[]): Promise<Paginator<CommentViewModel> | null>{
    //const isFinded = await this.postModel.findById(postId)
    const isFinded = await this.dataSource.query(`
      SELECT * FROM public."Posts"
      WHERE "id" = $1
    `,[postId])
    if(!isFinded[0]){
      throw new NotFoundException()
    }
    const query = createPaginationQuery(params)
    const skip = (query.pageNumber - 1) * query.pageSize
    // const comments = await this.commentModel.find({postId: postId, 'commentatorInfo.userId': { $nin: bannedUserIds }}, {postId: false, __v: false})
    // .sort({[query.sortBy]: query.sortDirection === 'asc' ? 1 : -1})
    // .skip(skip)
    // .limit(query.pageSize).lean()
    // const count = await this.commentModel.countDocuments({postId: postId, 'commentatorInfo.userId': { $nin: bannedUserIds }})
    const comments: SQLComment[] = await this.dataSource.query(`
    SELECT * FROM public."Comments" c
    WHERE "postId" = $1
    ORDER BY c."${query.sortBy}" COLLATE "C" ${query.sortDirection}
    OFFSET $2
    LIMIT $3
    `, [postId, skip, query.pageSize])
    const count = await this.dataSource.query(`
      SELECT COUNT(*) FROM public."Comments"
      WHERE "postId" = $1
    `,[postId])
    const result = Paginator.createPaginationResult(+count[0].count, query, comments)

    return await this.editCommentToViewModel(result, userId, bannedUserIds)
  }

  // query repo shouldnt return document
  async getPostgByIdNoView(postId: string): Promise<PostEntity | null> {
    // const post = await this.postModel.findById(postId)
    // if(!post){
    //   return null
    // }
    // return post
    // const post: SQLPostViewModel = await this.dataSource.query(`
    // SELECT * FROM public."Posts"
    // WHERE id = $1
    // `, [postId])
    const post = await this.postRepository.findOneBy({id: postId})
    if(!post){
      return null
    }
    return post
  }

  async getPostsForSpecifiedBlog(blogId: string, params: QueryParamsModel, userId: string | null, bannedUserIds: string[]): Promise<Paginator<PostViewModel>>{
    const query = createPaginationQuery(params)
    const skip = (query.pageNumber - 1) * query.pageSize
    // const posts = await this.postModel.find(filter, {__v: false})
    // .sort({[query.sortBy]: query.sortDirection === 'asc' ? 1 : -1})
    // .skip(skip)
    // .limit(query.pageSize).lean()
    // const posts: SQLPostViewModel[] = await this.dataSource.query(`
    // SELECT * FROM public."Posts" p
    // WHERE "blogId" = $1
    // ORDER BY p."${query.sortBy}" COLLATE "C" ${query.sortDirection}
    // OFFSET $2
    // LIMIT $3
    // `, [blogId, skip, query.pageSize])
    // const count = await this.dataSource.query(`
    //   SELECT COUNT(*) FROM public."Posts" p
    //   WHERE "blogId" = $1
    // `,[blogId])

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
    // const filter = { postId: { $in: postIdArray }, 'commentatorInfo.userId': { $nin: bannedUserIds } }
    // const comments = await this.commentModel.find(filter, {__v: false}).sort({[query.sortBy]: query.sortDirection === 'asc' ? 1 : -1})
    // .skip(skip)
    // .limit(query.pageSize).lean()
    const comments: SQLComment[] = await this.dataSource.query(`
    SELECT * FROM public."Comments"
    WHERE "postId" IN $1 and ("commentatorInfo"->>'userId')::int NOT IN ($2)
    ORDER BY p."${query.sortBy}" COLLATE "C" ${query.sortDirection}
    OFFSET $3
    LIMIT $4
    `, [postIdArray, bannedUserIds, skip, query.pageSize])
    const count = await this.dataSource.query(`
      SELECT COUNT(*) FROM public."Posts" p
      WHERE "postId" IN $1 and ("commentatorInfo"->>'userId')::int NOT IN ($2)
    `,[postIdArray, bannedUserIds])
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

  private async getPostssForBlogs(blogIdArray: string[]): Promise<SQLPostViewModel[]> {
    // const posts = await this.postModel
    // .find({ blogId: { $in: blogIdArray } }).lean()
    // return posts
    const posts: SQLPostViewModel[] = await this.dataSource.query(`
    SELECT * FROM public."Posts"
    WHERE blogId IN ($1)
    `, [blogIdArray])
    return posts
  }

  private async editCommentToViewModel(comment: Paginator<SQLComment>, userId: string, bannedUserIds: string[]): Promise<Paginator<CommentViewModel>> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const newArray = {...comment, items: comment.items.map(({postId, likesAndDislikesCount, ...rest }) => ({
        ...rest, commentatorInfo: {userId: rest.commentatorInfo.userId, userLogin: rest.commentatorInfo.userLogin},
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

  async getCommentLikesAndDislikesById(commentId: UUID){
    const likesAndDislokes = await this.dataSource.query(`
      SELECT "userId", "addedAt", "likeStatus" FROM public."CommentLikesAndDislikes"
      WHERE "commentId" = $1
    `, [commentId])

    return likesAndDislokes
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