export enum StateVerb {
  archive = 'ARCHIVE',
  restore = 'RESTORE',
}

export class UpdateStateDto {
  public object: { groups: { id: string }[] };
  public verb: StateVerb;
  public target: string;
}
