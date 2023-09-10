import { ArgumentMetadata, BadRequestException, Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { BlogExistValidator } from '../BlogExistValidator';

@Injectable()
export class BlogIdValidationPipe implements PipeTransform {
  constructor(private readonly blogExistValidator: BlogExistValidator) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    const { type, data } = metadata;
    if (type === 'param' && data === 'blogId') {
      const isValidUUIDv4 = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value)
      if (!isValidUUIDv4) {
        throw new BadRequestException(`Invalid ${data}. It should be a valid uuid.`);
      }

      const isValid = await this.blogExistValidator.validate(value);
      if (!isValid) {
        throw new NotFoundException(`Blog with id "${value}" does not exist.`);
      }
    }

    return value;
  }
}