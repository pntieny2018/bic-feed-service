export class ActorObjectDto {
  public id: string;
  public username?: string;
  public avatar?: string;
  public fullname?: string;

  public constructor(data: ActorObjectDto) {
    this.id = data.id;
    this.username = data.username;
    this.avatar = data.avatar;
    this.fullname = data.fullname;
  }
}

export class UserMentionObjectDto {
  [key: string]: ActorObjectDto;
}
