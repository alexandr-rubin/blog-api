import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { QuizGamesQueryRepository } from '../quiz/pair-quiz-game/quiz-games.query-repository';

@ValidatorConstraint({ async: true })
@Injectable()
export class QuizGameExistValidator implements ValidatorConstraintInterface {
  constructor(private readonly quizGamesQueryRepository: QuizGamesQueryRepository) {}

  async validate(gameId: string) {
    // проверка на null mb
    const game = await this.quizGamesQueryRepository.getGameByIdNoView(gameId);
    return !!game;
  }

  defaultMessage(args: ValidationArguments) {
    return `Game with id "${args.value}" does not exist.`;
  }
}