import { Injectable, PipeTransform, ArgumentMetadata, NotFoundException } from "@nestjs/common";
import { CommentExistValidator } from "../CommentExistValidator";

@Injectable()
export class CommentIdValidationPipe implements PipeTransform {
  constructor(private readonly commentExistValidator: CommentExistValidator) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    const { type, data } = metadata;
    if (type === 'param' && data === 'commentId') {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(value);
      if (!isValidObjectId) {
        throw new NotFoundException(`Invalid ${data}. It should be a valid ObjectId.`);
      }

      const isValid = await this.commentExistValidator.validate(value);
      if (!isValid) {
        throw new NotFoundException(`Comment with id "${value}" does not exist.`);
      }
    }

    return value;
  }
}