import { ArgumentMetadata, Injectable, NotFoundException, PipeTransform } from "@nestjs/common";
import { PostExistValidator } from "../PostExistValidator";

@Injectable()
export class PostIdValidationPipe implements PipeTransform {
  constructor(private readonly postExistValidator: PostExistValidator) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    const { type, data } = metadata;
    if (type === 'param' && data === 'postId') {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(value);
      if (!isValidObjectId) {
        throw new NotFoundException(`Invalid ${data}. It should be a valid ObjectId.`);
      }

      const isValid = await this.postExistValidator.validate(value);
      if (!isValid) {
        throw new NotFoundException(`Post with id "${value}" does not exist.`);
      }
    }

    return value;
  }
}