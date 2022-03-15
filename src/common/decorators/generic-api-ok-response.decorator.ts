import { ClassType } from '../types';
import { ResponseMeta } from '../dto';
import { ApiOkResponse, ApiProperty } from '@nestjs/swagger';
import { applyDecorators, HttpStatus, Type } from '@nestjs/common';

function ResponseDtoMixinClass<T extends ClassType>(resourceCls: T): ClassType {
  class ResponseDto {
    @ApiProperty({
      default: HttpStatus.OK,
    })
    public code: number;

    @ApiProperty({
      type: resourceCls,
    })
    public data: T;

    @ApiProperty({
      required: false,
    })
    public meta?: ResponseMeta;
  }

  return ResponseDto;
}

export function GenericApiOkResponse<TModel extends Type>(
  model: TModel,
  description?: string
): MethodDecorator {
  return applyDecorators(
    ApiOkResponse({
      type: ResponseDtoMixinClass(model),
      description: description ?? 'OK',
    })
  );
}
