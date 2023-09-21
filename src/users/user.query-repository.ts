import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Paginator } from "../models/Paginator";
import { QueryParamsModel } from "../models/PaginationQuery";
import { createPaginationQuery } from "../helpers/pagination";
import { User, UserDocument } from "./models/schemas/User";
import { BlogAdminViewModel } from "../blogs/models/view/BlogAdminViewModel";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { UserEntity } from "./user.entity";

@Injectable()
export class UserQueryRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>, @InjectDataSource() protected dataSource: DataSource,
  @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>){}

  async getUsers(params: QueryParamsModel): Promise<Paginator<UserEntity>> {
    //
    const query = createPaginationQuery(params)
    const skip = (query.pageNumber - 1) * query.pageSize
    //
    const search : any = {}
    if(query.searchLoginTerm != null){
      search.login = {$regex: query.searchLoginTerm, $options: 'i'}
    }
    if(query.searchEmailTerm != null){
      search.email = {$regex: query.searchEmailTerm, $options: 'i'}
    }
    // if(query.banStatus != null && query.banStatus === "banned"){
    //   search["banInfo.isBanned"] = true
    // }
    // if(query.banStatus != null && query.banStatus === "notBanned"){
    //   search["banInfo.isBanned"] = false
    // }

    // const users: User[] = await this.dataSource.query(`
    // SELECT id, login, email, "createdAt" FROM public."Users" u
    // WHERE (COALESCE(u."login" ILIKE $1, true) OR COALESCE(u."email" ILIKE $2, true))
    // ORDER BY u."${query.sortBy}" COLLATE "C" ${query.sortDirection}
    // OFFSET $3
    // LIMIT $4
    // `, [query.searchLoginTerm ? `%${query.searchLoginTerm}%` : null, query.searchEmailTerm ? `%${query.searchEmailTerm}%` : null, skip, query.pageSize])

    const users = await this.userRepository
    .createQueryBuilder('user')
    .select(['user.id', 'user.login', 'user.email', 'user.createdAt'])
    .where((qb) => {
      if (query.searchLoginTerm || query.searchEmailTerm) {
        qb.andWhere('(user.login ILIKE :searchLoginTerm OR user.email ILIKE :searchEmailTerm)', {
          searchLoginTerm: query.searchLoginTerm ? `%${query.searchLoginTerm}%` : '',
          searchEmailTerm: query.searchEmailTerm ? `%${query.searchEmailTerm}%` : '',
        });
      }
    })
    .orderBy(`user.${query.sortBy} COLLATE "C"`, query.sortDirection === 'asc' ? 'ASC' : 'DESC')
    .skip(skip)
    .take(query.pageSize)
    .getMany()

    // const count = await this.userModel.countDocuments({$or: searchTermsArray.length === 0 ? [{}] : searchTermsArray})
    // const count = await this.dataSource.query(`
    //   SELECT COUNT(*) FROM public."Users" u
    //   WHERE (COALESCE(u."login" ILIKE $1, true) OR COALESCE(u."email" ILIKE $2, true))
    // `,[query.searchLoginTerm ? `%${query.searchLoginTerm}%` : null, query.searchEmailTerm ? `%${query.searchEmailTerm}%` : null])
    const count = await this.countUsers(query)

    const result = Paginator.createPaginationResult(count, query, users)
    
    return result
  }

  private async countUsers(query: { searchLoginTerm?: string; searchEmailTerm?: string }): Promise<number> {
    const { searchLoginTerm, searchEmailTerm } = query;

    const builder = this.userRepository.createQueryBuilder('user')
      .select('COUNT(*)', 'count')
      .where('(COALESCE(user.login ILIKE :searchLoginTerm, true) OR COALESCE(user.email ILIKE :searchEmailTerm, true))', {
        searchLoginTerm: searchLoginTerm ? `%${searchLoginTerm}%` : null,
        searchEmailTerm: searchEmailTerm ? `%${searchEmailTerm}%` : null,
      })

    const result = await builder.getRawOne()
    return +result.count
  }

  async getUsergByIdNoView(userId: string): Promise<UserEntity | null> {
    // const user = await this.userModel.findById(userId, { __v: false }).lean()
    // const user: SQLUser = await this.dataSource.query(`
    // SELECT * FROM public."Users"
    // WHERE id = $1
    // `, [userId])
    // if(!user[0]){
    //   return null
    // }
    // return user[0]
    const user = await this.userRepository.findOneBy({id: userId})
    if(!user){
      return null
    }

    return user
  }

  async findUserByConfirmationEmailCode(code: string): Promise<UserEntity | null>{
    // const user = await this.userModel.findOne({'confirmationEmail.confirmationCode': code})
    // return user
    // const user: SQLUser = await this.dataSource.query(`
    // SELECT * FROM public."Users"
    // WHERE "confirmationEmail"->>'confirmationCode' = $1
    // `, [code]);

    // return user[0]

    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('"confirmationEmail"->>\'confirmationCode\' = :code', { code: code })
      .getOne()

    return user
  }

  async findUserByConfirmationPasswordCode(code: string): Promise<UserEntity | null>{
    // const user = await this.userModel.findOne({'confirmationPassword.confirmationCode': code})
    // return user
    // const user = await this.dataSource.query(`
    // SELECT * FROM public."Users"
    // WHERE "confirmationPassword"->>'confirmationCode' = $1
    // `, [code]);

    // return user[0]

    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('"confirmationPassword"->>\'confirmationCode\' = :code', { code: code })
      .getOne()

    return user
  }

  async getUsergByEmail(email: string): Promise<UserEntity | null> {
    // const user = await this.userModel.findOne({email: email})
    // const user = await this.dataSource.query(`SELECT * FROM public."Users" 
    // WHERE email = $1`, [email])
    // if(!user[0]){
    //   return null
    // }
    // return user[0]
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where({ email: email })
      .getOne()

    return user
  }

  // rename method
  async getUsersForAdminBlogs(blogs: BlogAdminViewModel[]) {
    for(const blog of blogs){
      const user = await this.getUsergByIdNoView(blog.blogOwnerInfo.userId)
      if(!user){
        throw new NotFoundException() 
      }

      blog.blogOwnerInfo.userLogin = user.login
    }

    return blogs
  }

  async getUsergByLogin(login: string): Promise<UserEntity | null> {
    // const user = await this.userModel.findOne({login: login})
    // const user = await this.dataSource.query(`SELECT * FROM public."Users" 
    // WHERE login = $1`, [login])
    // if(!user[0]){
    //   return null
    // }
    // return user[0]

    const user = await this.userRepository
      .createQueryBuilder('user')
      .where({ login: login })
      .getOne()

    return user
  }

  async getBannedUsersId(): Promise<string[]> {
    const bannedUsers = await this.userModel.find({'banInfo.isBanned': true}, '_id')
    const bannedUserIds = bannedUsers.map(user => user._id.toString());
    return bannedUserIds
  }
}