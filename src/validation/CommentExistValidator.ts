import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { CommentQueryRepository } from '../comments/comment.query-repository';

@ValidatorConstraint({ async: true })
export class CommentExistValidator implements ValidatorConstraintInterface {
  constructor(private readonly commentQueryRepository: CommentQueryRepository) {}

  async validate(blogId: string) {
    const comment = await this.commentQueryRepository.getCommentByIdNoView(blogId)
    return !!comment
  }

  defaultMessage(args: ValidationArguments) {
    return `Comment with id "${args.value}" does not exist.`;
  }
}