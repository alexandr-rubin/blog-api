import { ArgumentMetadata, BadRequestException, Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { BlogExistValidator } from '../BlogExistValidator';

@Injectable()
export class BlogIdValidationPipe implements PipeTransform {
  constructor(private readonly blogExistValidator: BlogExistValidator) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    const { type, data } = metadata;
    if (type === 'param' && data === 'blogId') {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(value);
      if (!isValidObjectId) {
        throw new BadRequestException(`Invalid ${data}. It should be a valid ObjectId.`);
      }

      const isValid = await this.blogExistValidator.validate(value);
      if (!isValid) {
        throw new NotFoundException(`Blog with id "${value}" does not exist.`);
      }
    }

    return value;
  }
}