import { ArgumentMetadata, BadRequestException, Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { QuestionExistValidator } from '../QuestionExistValidator';

@Injectable()
export class QuestionIdValidationPipe implements PipeTransform {
  constructor(private readonly questionExistValidator: QuestionExistValidator) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    const { type, data } = metadata;
    if (type === 'param' && data === 'questionId') {
      const isValidUUIDv4 = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value)
      if (!isValidUUIDv4) {
        throw new BadRequestException(`Invalid ${data}. It should be a valid uuid.`);
      }

      const isValid = await this.questionExistValidator.validate(value);
      if (!isValid) {
        throw new NotFoundException(`Question with id "${value}" does not exist.`);
      }
    }

    return value;
  }
}