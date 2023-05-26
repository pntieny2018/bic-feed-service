import { SeriesDto } from '../../dto/series.dto';

export class CreateSeriesDto extends SeriesDto {
  public constructor(data: Partial<CreateSeriesDto>) {
    super(data);
  }
}
