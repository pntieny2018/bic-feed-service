import { ApiProperty } from '@nestjs/swagger';

export class ResponseMeta {
  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  errors?: unknown;

  @ApiProperty({ required: false })
  stack?: unknown;
}

export class ResponseDto<T> {
  code: number;

  data: T;

  meta: ResponseMeta;

  constructor(data: Partial<ResponseDto<T>>) {
    Object.assign(this, data);
  }
}
