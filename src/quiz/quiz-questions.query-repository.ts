import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { QuizQuestionEntity } from "./quiz-questions/entities/quiz-question.entity";
import { Paginator } from "../models/Paginator";
import { QuizQuestionViewModel } from "./quiz-questions/models/view/quiz-question";
import { createPaginationQuery } from "../helpers/pagination";
import { QueryParamsModel } from "../models/PaginationQuery";
import { PublishStatuses } from "../helpers/publishedStatuses";

@Injectable()
export class QuizQuestionsQueryRepository {
  constructor(@InjectRepository(QuizQuestionEntity) private readonly quizQuestionsRepository: Repository<QuizQuestionEntity>){}
  
  async getQuestions(params: QueryParamsModel): Promise<Paginator<QuizQuestionViewModel>> {
    const query = createPaginationQuery(params)
    const skip = (query.pageNumber - 1) * query.pageSize

    const qb = await this.buildQuestionQueryBuilder(query)
    const questions = await qb
    .orderBy(`question.${query.sortBy} COLLATE "C"`, query.sortDirection === 'asc' ? 'ASC' : 'DESC')
    .skip(skip)
    .take(query.pageSize)
    .getMany()

    const mappedQuestions = questions.map(blog => {
      return {
        ...blog,
        correctAnswers: Object.keys(blog.correctAnswers)
      };
    });

    const count = await this.countQuestions(query)
    const result = Paginator.createPaginationResult(count, query, mappedQuestions)
    
    return result
  }

  private async countQuestions(query: QueryParamsModel): Promise<number> {
    const qb = await this.buildQuestionQueryBuilder(query)
    const builder = qb.select('COUNT(*)', 'count')

    const result = await builder.getRawOne()
    return +result.count
  }

  private async buildQuestionQueryBuilder (query: QueryParamsModel) {
    const qb = this.quizQuestionsRepository.createQueryBuilder('question')
      .select();
  
    if (query.publishedStatus !== PublishStatuses.All) {
      qb.andWhere('question.published = :publishedStatus', {
        publishedStatus: query.publishedStatus === PublishStatuses.Published
      });
    }
  
    if (query.bodySearchTerm) {
      qb.andWhere('question.body ILIKE :bodySearchTerm', {
        bodySearchTerm: `%${query.bodySearchTerm}%`
      });
    }
  
    return qb;
  };
}