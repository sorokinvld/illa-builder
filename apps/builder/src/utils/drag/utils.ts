import { Active, ClientRect, Over, Translate } from "@dnd-kit/core"
import { ComponentNode } from "@/redux/currentApp/editor/components/componentsState"
import { cloneDeep } from "lodash"
import { getEventCoordinates } from "@dnd-kit/utilities"

export const getOverData = (over: Over | null) => {
  if (over && over.data.current) {
    return over.data.current
  }
  return null
}

export const getOverRect = (over: Over | null) => {
  if (over && over.rect) {
    return over.rect
  }
  return null
}

export const getOverId = (over: Over | null) => {
  if (over && over.id) {
    return over.id as string
  }
  return null
}

export const getActiveData = (active: Active | null) => {
  if (active && active.data.current) {
    return active.data.current
  }
  return null
}

export const getActiveRect = (active: Active | null) => {
  if (active && active.rect && active.rect.current.initial) {
    return active.rect.current.initial
  }
  return null
}

export function isOverBoundingRect(
  delta: Translate,
  rect: ClientRect,
  boundingRect: ClientRect,
): boolean {
  if (rect.top + delta.y < boundingRect.top) {
    return false
  } else if (rect.bottom + delta.y > boundingRect.top + boundingRect.height) {
    return false
  }
  if (rect.left + delta.x < boundingRect.left) {
    return false
  } else if (rect.right + delta.x > boundingRect.left + boundingRect.width) {
    return false
  }
  return true
}

export function isOverBoundingRectByComponentNode(
  item: { left: number; top: number; bottom: number; right: number },
  boundingRect: ClientRect,
): boolean {
  if (item.top < boundingRect.top) {
    return false
  } else if (item.bottom > boundingRect.top + boundingRect.height) {
    return false
  }
  if (item.left < boundingRect.left) {
    return false
  } else if (item.right > boundingRect.left + boundingRect.width) {
    return false
  }
  return true
}

export function checkComponentNode(item: ComponentNode, blockColumns: number) {
  const newItem = cloneDeep(item)
  if (newItem.x < 0) {
    newItem.x = 0
  }
  if (newItem.y < 0) {
    newItem.y = 0
  }
  if (newItem.x + newItem.w > blockColumns) {
    newItem.x = blockColumns - newItem.w
  }
  return newItem
}

export const getRealComponentNodePosition = (
  item: ComponentNode,
  delta: Translate,
  over: Over | null,
  active: Active | null,
  activatorEvent: MouseEvent,
): ComponentNode => {
  const overData = getOverData(over)
  const overRect = getOverRect(over)
  const overId = getOverId(over)
  const activeRect = getActiveRect(active)
  const activatorCoordinates = getEventCoordinates(activatorEvent)

  if (
    !overData ||
    !overRect ||
    !overId ||
    !activeRect ||
    !activatorCoordinates
  ) {
    return item
  }
  const newItem = {
    ...item,
    x: activatorCoordinates.x,
    y: activatorCoordinates.y,
  }
  const offsetX = activatorCoordinates.x - activeRect.left
  const offsetY = activatorCoordinates.y - activeRect.top
  const { unitWidth, unitHeight } = overData

  const newX = Math.round(
    (newItem.x + delta.x - overRect.left - offsetX) / unitWidth,
  )
  const newY = Math.round(
    (newItem.y + delta.y - overRect.top - offsetY) / unitHeight,
  )

  return {
    ...newItem,
    x: newX,
    y: newY,
    unitW: unitWidth,
    unitH: unitHeight,
    parentNode: overId,
  }
}
