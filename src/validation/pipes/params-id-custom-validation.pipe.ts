import { ArgumentMetadata, Injectable, NotFoundException, PipeTransform, Provider } from '@nestjs/common';
import { BlogExistValidator } from '../BlogExistValidator';
import { PostExistValidator } from '../PostExistValidator';
import { CommentExistValidator } from '../CommentExistValidator';
import { UserExistValidator } from '../UserExistValidator';

@Injectable()
export class IdValidationPipe implements PipeTransform {
  static UserExistValidator: Provider;
  constructor(
    private readonly blogExistValidator: BlogExistValidator,
    private readonly postExistValidator: PostExistValidator,
    private readonly commentExistValidator: CommentExistValidator,
    private readonly userIdExistValidator: UserExistValidator,
  ) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    const { type, data } = metadata;
    if (type === 'param' && (data === 'blogId' || data === 'postId' || data === 'commentId' || data === 'userId')) {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(value);
      if (!isValidObjectId) {
        throw new NotFoundException(`Invalid ${data}. It should be a valid ObjectId.`);
      }

      let isValid = false;
      switch (data) {
        case 'blogId':
          isValid = await this.blogExistValidator.validate(value);
          if (!isValid) {
            throw new NotFoundException(`Blog with id "${value}" does not exist.`);
          }
          break;
        case 'postId':
          isValid = await this.postExistValidator.validate(value);
          if (!isValid) {
            throw new NotFoundException(`Post with id "${value}" does not exist.`);
          }
          break;
        case 'commentId':
          isValid = await this.commentExistValidator.validate(value);
          if (!isValid) {
            throw new NotFoundException(`Comment with id "${value}" does not exist.`);
          }
          break;
        case 'userId':
          isValid = await this.userIdExistValidator.validate(value);
          if (!isValid) {
            throw new NotFoundException(`User with id "${value}" does not exist.`);
          }
          break;
      }
    }

    return value;
  }
}
