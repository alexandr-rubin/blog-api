import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Paginator } from "../models/Paginator";
import { QueryParamsModel } from "../models/PaginationQuery";
import { createPaginationQuery } from "../helpers/pagination";
import { LikeStatuses } from "../helpers/likeStatuses";
import { WithId } from 'mongodb' 
import { CommentViewModel } from "../comments/models/view/CommentViewModel";
import { Comment, CommentDocument } from "../comments/models/schemas/Comment";
import { PostViewModel } from "./models/view/Post";
import { PostDocument, Post, PostLike } from "./models/schemas/Post";
import { CommentLike } from "../comments/models/schemas/CommentLike";
import { DataSource } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import { SQLPostViewModel } from "./models/view/SQLPost";

@Injectable()
export class PostQueryRepository {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>, @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  @InjectDataSource() protected dataSource: DataSource){}
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
    const posts: SQLPostViewModel[] = await this.dataSource.query(`
    SELECT * FROM public."Posts" p
    ORDER BY p."${query.sortBy}" COLLATE "C" ${query.sortDirection}
    OFFSET $1
    LIMIT $2
    `, [skip, query.pageSize])
    const count = await this.dataSource.query(`
      SELECT COUNT(*) FROM public."Posts"`)
    const transformedPosts = posts.map((post) => {
      const {...rest } = post
      const id = rest.id
      return { id, ...rest }
    })
    const result = Paginator.createPaginationResult(count[0].count, query, transformedPosts)

    return await this.editPostToViewModel(result, userId, bannedUserIds)
  }

  async getPostgById(postId: string, userId: string, bannedUserIds: string[], bannedBlogsIds: string[]): Promise<PostViewModel | null> {
    // const post = await this.postModel
    // .findOne({
    //   _id: postId,
    //   blogId: { $nin: bannedBlogsIds }
    // }, { __v: false })
    const post: SQLPostViewModel = await this.dataSource.query(`
    SELECT * FROM public."Posts"
    WHERE id = $1
    `, [postId])
    if(!post[0]){
      throw new NotFoundException()
    }
    const like = post[0].likesAndDislikes.find(like => like.userId === userId && !bannedUserIds.includes(like.userId))
    const likeStatus = like === undefined ? LikeStatuses.None : like.likeStatus
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    //const newestLikes = post.likesAndDislikes.filter((element) => element.likeStatus === 'Like').slice(-3).map((element) => element).map(({ likeStatus, ...rest }) => rest)
    const newestLikes = post[0].likesAndDislikes
    .filter((element) => element.likeStatus === 'Like' && !bannedUserIds.includes(element.userId))
    .slice(-3)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ likeStatus, ...rest }) => rest)
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())

    const filteredLikesAndDislikes = this.filterLikesAndDislikes(post[0].likesAndDislikes, bannedUserIds)
    const likesCount = filteredLikesAndDislikes.likesCount
    const dislikesCount = filteredLikesAndDislikes.dislikesCount

    const rest = {...post[0], extendedLikesInfo: {likesCount: likesCount, dislikesCount: dislikesCount, 
    myStatus: likeStatus, newestLikes: newestLikes }, likesAndDislikesCount: undefined, likesAndDislikes: undefined}

    return rest
  }

  public async editPostToViewModel(post: Paginator<SQLPostViewModel>, userId: string, bannedUserIds: string[]): Promise<Paginator<PostViewModel>>  {
    const newArray: Paginator<PostViewModel> = {
      ...post,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      items: post.items.map(({ likesAndDislikesCount, ...rest }) => {
        delete rest.likesAndDislikes
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
      const filteredLikesAndDislikes = this.filterLikesAndDislikes(post.items[i].likesAndDislikes, bannedUserIds)
      const likesCount = filteredLikesAndDislikes.likesCount
      const dislikesCount = filteredLikesAndDislikes.dislikesCount

      newArray.items[i].extendedLikesInfo.likesCount = likesCount
      newArray.items[i].extendedLikesInfo.dislikesCount = dislikesCount

      const newestLikes = post.items[i].likesAndDislikes
      .filter((element) => element.likeStatus === 'Like' && !bannedUserIds.includes(element.userId))
      .slice(-3)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ likeStatus, ...rest }) => rest)
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      newArray.items[i].extendedLikesInfo.newestLikes = newestLikes
      // const status = await this.postLikeModel.findOne({createdAt: newArray.items[i].createdAt, userId: userId})
      const status = post.items[i].likesAndDislikes.find(element => element.userId === userId)
      if(status){
          newArray.items[i].extendedLikesInfo.myStatus = status.likeStatus
      }
    }
    return newArray 
  }
  
  async getCommentsForSpecifiedPost(postId: string, params: QueryParamsModel, userId: string, bannedUserIds: string[]): Promise<Paginator<CommentViewModel> | null>{
    const isFinded = await this.postModel.findById(postId)
    if(!isFinded){
      throw new NotFoundException()
    }
    const query = createPaginationQuery(params)
    const skip = (query.pageNumber - 1) * query.pageSize
    const comments = await this.commentModel.find({postId: postId, 'commentatorInfo.userId': { $nin: bannedUserIds }}, {postId: false, __v: false})
    .sort({[query.sortBy]: query.sortDirection === 'asc' ? 1 : -1})
    .skip(skip)
    .limit(query.pageSize).lean()
    const count = await this.commentModel.countDocuments({postId: postId, 'commentatorInfo.userId': { $nin: bannedUserIds }})
    const result = Paginator.createPaginationResult(count, query, comments)

    return await this.editCommentToViewModel(result, userId, bannedUserIds)
  }

  // query repo shouldnt return document
  async getPostgByIdNoView(postId: string): Promise<SQLPostViewModel | null> {
    // const post = await this.postModel.findById(postId)
    // if(!post){
    //   return null
    // }
    // return post
    const post: SQLPostViewModel = await this.dataSource.query(`
    SELECT * FROM public."Posts"
    WHERE id = $1
    `, [postId])
    if(!post[0]){
      return null
    }
    return post[0]
  }

  async getPostsForSpecifiedBlog(blogId: string, params: QueryParamsModel, userId: string | null, bannedUserIds: string[]): Promise<Paginator<PostViewModel>>{
    const query = createPaginationQuery(params)
    const skip = (query.pageNumber - 1) * query.pageSize
    // const posts = await this.postModel.find(filter, {__v: false})
    // .sort({[query.sortBy]: query.sortDirection === 'asc' ? 1 : -1})
    // .skip(skip)
    // .limit(query.pageSize).lean()
    const posts: SQLPostViewModel[] = await this.dataSource.query(`
    SELECT * FROM public."Posts" p
    WHERE "blogId" = $1
    ORDER BY p."${query.sortBy}" COLLATE "C" ${query.sortDirection}
    OFFSET $2
    LIMIT $3
    `, [blogId, skip, query.pageSize])
    const count = await this.dataSource.query(`
      SELECT COUNT(*) FROM public."Posts" p
      WHERE "blogId" = $1
    `,[blogId])
    const transformedPosts = posts.map(({ ...rest }) => ({ id: rest.id, ...rest }))
    const result = Paginator.createPaginationResult(+count[0].count, query, transformedPosts)
    return this.editPostToViewModel(result, userId, bannedUserIds)
  }
  
  async getCommentsForBlogs(params: QueryParamsModel, blogIdArray: string[], userId: string, bannedUserIds: string[]): Promise<Paginator<CommentViewModel>> {
    const postsArray = await this.getPostssForBlogs(blogIdArray)
    const postIdArray = postsArray.map(({...post}) => (post._id.toString()))
    const query = createPaginationQuery(params)
    const skip = (query.pageNumber - 1) * query.pageSize
    const filter = { postId: { $in: postIdArray }, 'commentatorInfo.userId': { $nin: bannedUserIds } }
    const comments = await this.commentModel.find(filter, {__v: false}).sort({[query.sortBy]: query.sortDirection === 'asc' ? 1 : -1})
    .skip(skip)
    .limit(query.pageSize).lean()
    const mappedComments = comments.map(comment => {
      // if !post
      const post = postsArray.find(post => post._id.toString() === comment.postId)
      delete comment.postId
      const postInfo = {
        id: post._id,
        title: post.title,
        blogId: post.blogId,
        blogName: post.blogName
      }

      return {...comment, postInfo}
    })

    const count = await this.commentModel.countDocuments(filter)
    const result = Paginator.createPaginationResult(count, query, mappedComments)

    return await this.editCommentToViewModel(result, userId, bannedUserIds)
  }

  private async getPostssForBlogs(blogIdArray: string[]): Promise<WithId<Post>[]> {
    const posts = await this.postModel
    .find({ blogId: { $in: blogIdArray } }).lean()
    return posts
  }

  private async editCommentToViewModel(comment: Paginator<WithId<Comment>>, userId: string, bannedUserIds: string[]): Promise<Paginator<CommentViewModel>> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const newArray = {...comment, items: comment.items.map(({ _id, likesAndDislikesCount, likesAndDislikes, ...rest }) => ({
        id: _id.toString(), ...rest, commentatorInfo: {userId: rest.commentatorInfo.userId, userLogin: rest.commentatorInfo.userLogin},
        likesInfo: { likesCount: 0,  dislikesCount: 0, myStatus: LikeStatuses.None.toString() }
    }))}
    for(let i = 0; i < newArray.items.length; i++){
      const filteredLikesAndDislikes = this.filterLikesAndDislikes(comment.items[i].likesAndDislikes, bannedUserIds)
      const likesCount = filteredLikesAndDislikes.likesCount
      const dislikesCount = filteredLikesAndDislikes.dislikesCount

      newArray.items[i].likesInfo.likesCount = likesCount
      newArray.items[i].likesInfo.dislikesCount = dislikesCount

      const status = comment.items[i].likesAndDislikes.find(element => element.userId === userId)
      if(status){
        newArray.items[i].likesInfo.myStatus = status.likeStatus
      }
    }
    return newArray
  }

  private filterLikesAndDislikes(likesAndDislikes: PostLike[] | CommentLike[], bannedUserIds: string[]) {
    const filteredLikesAndDislikes = likesAndDislikes
    .filter(element => !bannedUserIds.includes(element.userId))
    const likesCount = filteredLikesAndDislikes.filter(element => element.likeStatus === LikeStatuses.Like).length
    const dislikesCount = filteredLikesAndDislikes.filter(element => element.likeStatus === LikeStatuses.Dislike).length

    return { likesCount: likesCount, dislikesCount: dislikesCount }
  }
}