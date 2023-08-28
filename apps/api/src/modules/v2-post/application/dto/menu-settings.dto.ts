export class MenuSettingsDto {
  public canEdit = false;
  public canEditSetting = false;
  public isSave = false;
  public canCopyLink = true;
  public canViewReactions = false;
  public canViewSeries = false;
  public canPinContent = false;
  public canCreateQuiz = false;
  public canDeleteQuiz = false;
  public canEditQuiz = false;
  public canDelete = false;
  public canReportContent = false;
  public canReportMember = false;
  public isEnableNotifications = false;

  public constructor(data: Partial<MenuSettingsDto>) {
    Object.assign(this, data);
  }
}
