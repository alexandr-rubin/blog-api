import { ArgumentMetadata, Injectable, NotFoundException, PipeTransform } from "@nestjs/common";
import { PostExistValidator } from "../PostExistValidator";

@Injectable()
export class PostIdValidationPipe implements PipeTransform {
  constructor(private readonly postExistValidator: PostExistValidator) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    const { type, data } = metadata;
    if (type === 'param' && data === 'postId') {
      const isValidUUIDv4 = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value)
      if (!isValidUUIDv4) {
        throw new NotFoundException(`Invalid ${data}. It should be a valid uuid.`);
      }

      const isValid = await this.postExistValidator.validate(value);
      if (!isValid) {
        throw new NotFoundException(`Post with id "${value}" does not exist.`);
      }
    }

    return value;
  }
}