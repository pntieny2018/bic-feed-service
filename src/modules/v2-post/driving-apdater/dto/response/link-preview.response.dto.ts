import { ApiProperty } from '@nestjs/swagger';

export class LinkPreviewResponseDto {
  @ApiProperty()
  public url: string;

  @ApiProperty()
  public domain: string = null;

  @ApiProperty()
  public image: string = null;

  @ApiProperty()
  public title: string = null;

  @ApiProperty()
  public description: string = null;
}
