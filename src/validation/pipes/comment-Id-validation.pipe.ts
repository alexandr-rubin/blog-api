import { Injectable, PipeTransform, ArgumentMetadata, NotFoundException } from "@nestjs/common";
import { CommentExistValidator } from "../CommentExistValidator";

@Injectable()
export class CommentIdValidationPipe implements PipeTransform {
  constructor(private readonly commentExistValidator: CommentExistValidator) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    const { type, data } = metadata;
    if (type === 'param' && data === 'commentId') {
      const isValidUUIDv4 = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value)
      if (!isValidUUIDv4) {
        throw new NotFoundException(`Invalid ${data}. It should be a valid uuid.`);
      }

      const isValid = await this.commentExistValidator.validate(value);
      if (!isValid) {
        throw new NotFoundException(`Comment with id "${value}" does not exist.`);
      }
    }

    return value;
  }
}