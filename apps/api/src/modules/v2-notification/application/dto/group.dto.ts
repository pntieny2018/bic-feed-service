export class AudienceObjectDto {
  public groups: GroupObjectDto[];

  public constructor(data: AudienceObjectDto) {
    Object.assign(this, data);
  }
}

class GroupObjectDto {
  public id: string;
  public name?: string;
  public icon?: string;
  public communityId?: string;
  public isCommunity?: boolean;

  public constructor(data: GroupObjectDto) {
    Object.assign(this, data);
  }
}
