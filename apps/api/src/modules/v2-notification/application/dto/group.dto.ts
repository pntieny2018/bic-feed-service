export class AudienceObjectDto {
  public groups: GroupObjectDto[];

  public constructor(data: AudienceObjectDto) {
    this.groups = data.groups.map((group) => new GroupObjectDto(group));
  }
}

export class GroupObjectDto {
  public id: string;
  public name?: string;
  public icon?: string;
  public communityId?: string;
  public isCommunity?: boolean;

  public constructor(data: GroupObjectDto) {
    this.id = data.id;
    this.name = data.name;
    this.icon = data.icon;
    this.communityId = data.communityId;
    this.isCommunity = data.isCommunity;
  }
}
