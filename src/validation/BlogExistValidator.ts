import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { BlogQueryRepository } from '../blogs/blog.query-repository';
import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ async: true })
@Injectable()
export class BlogExistValidator implements ValidatorConstraintInterface {
  constructor(private readonly blogQueryRepository: BlogQueryRepository) {}

  async validate(blogId: string) {
    // проверка на null mb
    const blog = await this.blogQueryRepository.getBlogByIdNoView(blogId);
    return !!blog;
  }

  defaultMessage(args: ValidationArguments) {
    return `Blog with id "${args.value}" does not exist.`;
  }
}