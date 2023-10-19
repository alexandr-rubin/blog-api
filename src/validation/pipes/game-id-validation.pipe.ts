import { ArgumentMetadata, BadRequestException, Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { QuizGameExistValidator } from '../GameExistValidator';

@Injectable()
export class QuizGameIdValidationPipe implements PipeTransform {
  constructor(private readonly gameExistValidator: QuizGameExistValidator) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    const { type, data } = metadata;
    if (type === 'param' && data === 'gameId') {
      const isValidUUIDv4 = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value)
      if (!isValidUUIDv4) {
        throw new BadRequestException(`Invalid ${data}. It should be a valid uuid.`);
      }

      const isValid = await this.gameExistValidator.validate(value);
      if (!isValid) {
        throw new NotFoundException(`Game with id "${value}" does not exist.`);
      }
    }

    return value;
  }
}