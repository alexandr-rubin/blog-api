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
import { UserEntity } from "./entities/user.entity";
import { QuizGameEntity } from "../quiz/pair-quiz-game/entities/quiz-game.entity";
import { UserBanStatuses } from "../helpers/userBanStatuses";

@Injectable()
export class UserQueryRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>, @InjectDataSource() protected dataSource: DataSource,
  @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>){}

  async getUsersRelatedToGames(): Promise<UserEntity[]> {
    const userIds = await this.userRepository
      .createQueryBuilder('user')
      .distinct(true)
      .innerJoin(QuizGameEntity, 'quizGame', 'user.id = quizGame.playerOneId OR user.id = quizGame.playerTwoId')
      .where('quizGame.playerTwoId IS NOT NULL')
      .select()
      .getMany()
    
    return userIds
  }

  async getUsers(params: QueryParamsModel): Promise<Paginator<UserEntity>> {
    const query = createPaginationQuery(params)
    const skip = (query.pageNumber - 1) * query.pageSize

    const whereCondition = (qb) => {
      if (query.searchLoginTerm || query.searchEmailTerm) {
        qb.andWhere('(user.login ILIKE :searchLoginTerm OR user.email ILIKE :searchEmailTerm)', {
          searchLoginTerm: query.searchLoginTerm ? `%${query.searchLoginTerm}%` : '',
          searchEmailTerm: query.searchEmailTerm ? `%${query.searchEmailTerm}%` : '',
        });
      }
      if (query.banStatus !== UserBanStatuses.All) {
        qb.andWhere('user.banInfo ->> \'isBanned\' = :isBanned', {
          isBanned: query.banStatus === UserBanStatuses.Banned ? true : false,
        });
      }
    };

    const users = await this.userRepository
    .createQueryBuilder('user')
    .select(['user.id', 'user.login', 'user.email', 'user.createdAt', 'user.banInfo'])
    .where(whereCondition)
    .orderBy(`user.${query.sortBy} COLLATE "C"`, query.sortDirection === 'asc' ? 'ASC' : 'DESC')
    .skip(skip)
    .take(query.pageSize)
    .getMany()

    const count = await this.countUsers(whereCondition)

    const result = Paginator.createPaginationResult(count, query, users)
    
    return result
  }

  private async countUsers(whereCondition): Promise<number> {

    const builder = this.userRepository.createQueryBuilder('user')
      .select('COUNT(*)', 'count')
      .where(whereCondition)

    const result = await builder.getRawOne()
    return +result.count
  }

  async getUsergByIdNoView(userId: string): Promise<UserEntity | null> {
    const user = await this.userRepository.findOneBy({id: userId})
    // вроде бы и так вернут null
    if(!user){
      return null
    }

    return user
  }

  async findUserByConfirmationEmailCode(code: string): Promise<UserEntity | null>{
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('"confirmationEmail"->>\'confirmationCode\' = :code', { code: code })
      .getOne()

    return user
  }

  async findUserByConfirmationPasswordCode(code: string): Promise<UserEntity | null>{

    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('"confirmationPassword"->>\'confirmationCode\' = :code', { code: code })
      .getOne()

    return user
  }

  async getUsergByEmail(email: string): Promise<UserEntity | null> {
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
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where({ login: login })
      .getOne()

    return user
  }

  async getBannedUsersId(): Promise<string[]> {
    const bannedUsers = await this.userRepository
    .createQueryBuilder('user')
    .select(['user.id'])
    .where('user.banInfo ->> \'isBanned\' = :isBanned', { isBanned: true })
    .getMany()
    const bannedUserIds = bannedUsers.map(user => user.id.toString())
    return bannedUserIds
  }
}