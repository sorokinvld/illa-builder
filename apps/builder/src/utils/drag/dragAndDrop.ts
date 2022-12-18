import { ComponentNode } from "@/redux/currentApp/editor/components/componentsState"
import { Translate } from "@dnd-kit/core/dist/types/coordinates"
import { Over } from "@dnd-kit/core/dist/store"
import {
  checkComponentNode,
  getOverData,
  getOverId,
  getOverRect,
} from "@/utils/drag/utils"

export const dragAndDropWhenUpdate = (
  item: ComponentNode,
  delta: Translate,
  over: Over | null,
) => {
  const overData = getOverData(over)
  if (!overData) {
    return item
  }

  const { unitWidth, unitHeight, blockColumns } = overData
  const newX = Math.ceil((item.x * unitWidth + delta.x) / unitWidth)
  const newY = Math.ceil((item.y * unitHeight + delta.y) / unitHeight)

  return checkComponentNode(
    {
      ...item,
      x: newX,
      y: newY,
      unitW: unitWidth,
      unitH: unitHeight,
    },
    blockColumns,
  )
}

export const dragAndDropWhenUpdateContainer = (
  item: ComponentNode,
  delta: Translate,
  over: Over | null,
): ComponentNode => {
  const overData = getOverData(over)
  const overRect = getOverRect(over)
  const overId = getOverId(over)
  if (!overData || !overRect || !overId) {
    return item
  }
  const { unitWidth, unitHeight } = overData
  const newX = Math.ceil((item.x + delta.x - overRect.left) / unitWidth)
  const newY = Math.ceil(
    (item.y + delta.y - overRect.top - item.h * unitHeight) / unitHeight,
  )

  return {
    ...item,
    x: newX,
    y: newY,
    unitW: unitWidth,
    unitH: unitHeight,
    parentNode: overId,
  }
}

export const dragAndDropWhenAdd = (
  item: ComponentNode,
  delta: Translate,
  over: Over | null,
) => {
  const overData = getOverData(over)
  const overRect = getOverRect(over)
  const overId = getOverId(over)
  if (!overData || !overRect || !overId) {
    return item
  }
  const { unitWidth, unitHeight } = overData
  const newX = Math.ceil((item.x + delta.x - overRect.left) / unitWidth)
  const newY = Math.ceil((item.y + delta.y - overRect.top) / unitHeight)

  return {
    ...item,
    x: newX,
    y: newY,
    unitW: unitWidth,
    unitH: unitHeight,
    parentNode: overId,
  }
}
