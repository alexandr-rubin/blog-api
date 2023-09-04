import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { PostQueryRepository } from '../posts/post.query-repository';

@ValidatorConstraint({ async: true })
export class PostExistValidator implements ValidatorConstraintInterface {
  constructor(private readonly postQueryRepository: PostQueryRepository) {}

  async validate(postId: string) {
    const post = await this.postQueryRepository.getPostgByIdNoView(postId);
    return !!post;
  }

  defaultMessage(args: ValidationArguments) {
    return `Post with id "${args.value}" does not exist.`;
  }
}