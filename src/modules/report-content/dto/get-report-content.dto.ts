// import { Expose } from 'class-transformer';
// import { ReportStatus } from '../contstants';
// import { ApiProperty } from '@nestjs/swagger';
// import { PageOptionsDto } from '../../../common/dto';
// import { IsOptional, IsUUID } from 'class-validator';
// import { IReportContentAttribute } from '../../../database/models/report-content.model';
//
// // id: string;
// // createdBy: string;
// // updatedBy: string;
// // targetId: string;
// // targetType: string;
// // authorId: string;
// // in: IReportContentGenealogy[];
// // reasonType: string;
// // reason?: string;
// // status?: string;
// // createdAt: Date;
// // updatedAt?: Date;
//
// export class GetReportContentDto
//   extends PageOptionsDto
//   implements Omit<IReportContentAttribute, 'in'>
// {
//   authorId: string;
//   createdAt: Date;
//   createdBy: string;
//   id: string;
//   reason: string;
//   reasonType: string;
//   status: string;
//   targetId: string;
//   targetType: string;
//   updatedAt: Date;
//   updatedBy: string;
//
//   @ApiProperty({
//     enum: [ReportStatus],
//   })
//   @IsOptional()
//   public status?: ReportStatus;
//
//   @ApiProperty({
//     name: 'author_id',
//   })
//   @IsOptional()
//   @IsUUID()
//   @Expose({
//     name: 'author_id',
//   })
//   public communityId?: string;
//
//   @ApiProperty({
//     name: 'target_id',
//   })
//   @IsOptional()
//   @IsUUID()
//   @Expose({
//     name: 'target_id',
//   })
//   public targetId?: string;
//
//   @ApiProperty({
//     name: 'author_id',
//   })
//   @IsOptional()
//   @IsUUID()
//   @Expose({
//     name: 'author_id',
//   })
//   public authorId?: string;
// }
