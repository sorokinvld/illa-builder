import { ComponentNode } from "@/redux/currentApp/editor/components/componentsState"
import { Translate } from "@dnd-kit/core/dist/types/coordinates"
import { Over } from "@dnd-kit/core/dist/store"
import { getOverData, getOverRect } from "@/utils/drag/utils"

export const dragAndDropRealPosition = (
  item: ComponentNode,
  delta: Translate,
  over: Over | null,
) => {
  const overData = getOverData(over)
  if (!overData) {
    return item
  }

  const { unitWidth, unitHeight } = overData
  const newX = (item.x * unitWidth + delta.x) / unitWidth
  const newY = (item.y * unitHeight + delta.y) / unitHeight
  return {
    ...item,
    x: newX,
    y: newY,
    unitW: unitWidth,
    unitH: unitHeight,
  }
}

export const getDraggingRect = (
  item: ComponentNode,
  delta: Translate,
  over: Over | null,
) => {
  // const dragItem = dragAndDropRealPosition(item, delta, over)
  const overData = getOverData(over)
  const overRect = getOverRect(over)
  if (!overData || !overRect) {
    return {
      left: item.x,
      top: item.y,
      right: item.x + item.w,
      bottom: item.y + item.h,
      width: item.w,
      height: item.h,
    }
  }
  return {
    left: item.x * overData.unitWidth + delta.x + overRect.left,
    top: item.y * overData.unitHeight + delta.y + overRect.top,
    right:
      item.x * overData.unitWidth +
      delta.x +
      overRect.left +
      item.w * overData.unitWidth,
    bottom:
      item.y * overData.unitHeight +
      delta.y +
      overRect.top +
      item.h * overData.unitHeight,
    width: item.w * overData.unitWidth,
    height: item.h * overData.unitHeight,
  }
}
