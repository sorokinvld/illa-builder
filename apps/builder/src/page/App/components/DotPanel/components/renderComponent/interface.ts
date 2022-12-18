import { ComponentNode } from "@/redux/currentApp/editor/components/componentsState"
export interface IRenderComponentProps {
  componentNode: ComponentNode
  unitWidth: number
  rowNumber: number
  canResizeY: boolean
  minHeight: number
  safeRowNumber: number
  addedRowNumber: number
  containerPadding: number
  blockColumns: number

  collisionEffect: Map<string, ComponentNode>
}
