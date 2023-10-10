export class ActorObjectDto {
  public id: string;
  public username?: string;
  public avatar?: string;
  public fullname?: string;
  public email?: string;

  public constructor(data: ActorObjectDto) {
    Object.assign(this, data);
  }
}
