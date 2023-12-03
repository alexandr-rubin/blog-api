import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { QuizQuestionsQueryRepository } from '../quiz/quiz-questions/quiz-questions.query-repository';

@ValidatorConstraint({ async: true })
@Injectable()
export class QuestionExistValidator implements ValidatorConstraintInterface {
  constructor(private readonly quizQuestionsQueryRepository: QuizQuestionsQueryRepository) {}

  async validate(questionId: string) {
    const question = await this.quizQuestionsQueryRepository.getQuestionByIdNoView(questionId);
    return !!question
  }

  defaultMessage(args: ValidationArguments) {
    return `Question with id "${args.value}" does not exist.`
  }
}