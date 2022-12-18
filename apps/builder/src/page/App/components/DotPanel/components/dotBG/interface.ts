import { ReactNode } from "react"
import { RectReadOnly } from "react-use-measure"

export interface IDotBGProps {
  blockColumns: number
  rowNumber: number
  children: ReactNode
  canvasRect: RectReadOnly
}
