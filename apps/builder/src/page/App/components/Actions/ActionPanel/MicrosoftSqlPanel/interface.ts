import { MicrosoftSqlActionType } from "@/redux/currentApp/action/microsoftSqlAction"

export interface MSSQLModeProps {
  modeContent: MicrosoftSqlActionType
  onChange: (name: string, value: string) => void
  resourceId?: string
}
