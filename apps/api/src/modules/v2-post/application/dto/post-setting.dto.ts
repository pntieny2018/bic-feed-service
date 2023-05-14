export class PostSettingDto {
  public canComment: boolean;
  public canShare: boolean;
  public canReact: boolean;
  public isImportant: boolean;
  public importantExpiredAt: Date;

  public constructor(data: Partial<PostSettingDto>) {
    Object.assign(this, data);
  }
}
