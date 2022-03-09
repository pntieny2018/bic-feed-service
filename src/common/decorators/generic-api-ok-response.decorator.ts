import { ClassType } from '../types';
import { ResponseMeta } from '../dto';
import { ApiOkResponse, ApiProperty } from '@nestjs/swagger';
import { applyDecorators, HttpStatus, Type } from '@nestjs/common';

function ResponseDtoMixinClass<T extends ClassType>(resourceCls: T): ClassType {
  class ResponseDto {
    @ApiProperty({
      default: HttpStatus.OK,
    })
    code: number;

    @ApiProperty({
      type: resourceCls,
    })
    data: T;

    @ApiProperty({
      required: false,
    })
    meta?: ResponseMeta;
  }

  return ResponseDto;
}

export function GenericApiOkResponse<TModel extends Type>(
  model: TModel
): MethodDecorator {
  return applyDecorators(
    ApiOkResponse({
      type: ResponseDtoMixinClass(model),
    })
  );
}
