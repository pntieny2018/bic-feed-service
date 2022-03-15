import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum UploadType {
  POST_IMAGE = 'post_image',
  COMMENT_IMAGE = 'comment_image',
  POST_VIDEO = 'post_video',
  COMMENT_VIDEO = 'comment_video',
  POST_FILE = 'post_file',
  COMMENT_FILE = 'comment_file',
}

export class UploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  public file: any;

  @ApiProperty({ enum: UploadType })
  public uploadType: UploadType;
}

export enum UploadFileType {
  image = 'image',
  video = 'video',
  file = 'file',
}

export const UploadPrefix = {
  [UploadType.POST_IMAGE]: 'post/images/original',
  [UploadType.COMMENT_IMAGE]: 'comment/images/original',
  [UploadType.POST_VIDEO]: 'post/videos/original',
  [UploadType.COMMENT_VIDEO]: 'comment/videos/original',
  [UploadType.POST_FILE]: 'post/files/original',
  [UploadType.COMMENT_FILE]: 'comment/files/original',
};

export class UploadQueryDto {
  @ApiProperty({ enum: UploadFileType })
  public type: UploadFileType;
}

export class GetSignedUrlDto {
  @ApiProperty({ example: 'abc.jpg' })
  @IsNotEmpty()
  public originalName: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsNotEmpty()
  public mimeType: string;

  @ApiProperty({ enum: UploadType })
  @IsEnum(UploadType)
  public resource: UploadType;
}

export class SignedUrlResponseDto {
  @ApiProperty({
    example:
      'https://abc.s3.ap-southeast-1.amazonaws.com/post-file/original/50457086-9331-4a1f-b991-4193e53d01e7/50457086-9331-4a1f-b991-4193e53d01e7.mp4?AWSAccessKeyId=XKIAUKGD6KMYZX7WELCB&Content-Type=image%2Fjpeg&Expires=1630896197&Signature=KB14xrIqibCL9he1XWLhfwpEvJ8%3D&x-amz-acl=public-read',
  })
  public uploadUrl: string;
  @ApiProperty({
    example:
      'https://abc.s3.ap-southeast-1.amazonaws.com/post-file/original/50457086-9331-4a1f-b991-4193e53d01e7/50457086-9331-4a1f-b991-4193e53d01e7.mp4',
  })
  public objectPath: string;
}

export class UploadResponseDto {
  @ApiProperty({ enum: UploadFileType })
  public type?: UploadFileType;
  @ApiProperty()
  public src: string;
}
