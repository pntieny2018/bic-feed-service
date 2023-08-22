export class MenuSettingsDto {
  public edit = false;
  public editSetting = false;
  public save = false;
  public unSave = false;
  public copyLink = true;
  public viewReactions = false;
  public viewSeries = false;
  public pinContent = false;
  public createQuiz = false;
  public deleteQuiz = false;
  public editQuiz = false;
  public delete = false;
  public reportContent = false;
  public reportMember = false;

  public constructor(data: Partial<MenuSettingsDto>) {
    Object.assign(this, data);
  }
}
