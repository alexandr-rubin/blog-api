import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { QuizQuestionEntity } from "./entities/quiz-question.entity";
import { Paginator } from "../../models/Paginator";
import { QuizQuestionViewModel } from "./models/view/quiz-question";
import { createPaginationQuery } from "../../helpers/pagination";
import { QueryParamsModel } from "../../models/PaginationQuery";
import { PaginationPublishStatuses } from "../../helpers/paginationPublishedStatuses";

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
      .select()
  
    if (query.publishedStatus !== PaginationPublishStatuses.All) {
      qb.andWhere('question.published = :publishedStatus', {
        publishedStatus: query.publishedStatus === PaginationPublishStatuses.Published
      })
    }
  
    if (query.bodySearchTerm) {
      qb.andWhere('question.body ILIKE :bodySearchTerm', {
        bodySearchTerm: `%${query.bodySearchTerm}%`
      })
    }
  
    return qb
  }

  async getQuestionByIdNoView(questionId: string): Promise<QuizQuestionEntity | null> {
    const question = await this.quizQuestionsRepository.findOneBy({id: questionId})
    
    if(!question){
      return null
    }
    return question
  }

  async getQuestionsForGame(): Promise<QuizQuestionEntity[]> {
    const randomQuestions = await this.quizQuestionsRepository
      .createQueryBuilder('question')
      .orderBy('RANDOM()')
      .take(10)
      .getMany();

    return randomQuestions
    }
}