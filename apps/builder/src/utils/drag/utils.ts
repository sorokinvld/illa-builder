import { Active, ClientRect, Over, Translate } from "@dnd-kit/core"
import { ComponentNode } from "@/redux/currentApp/editor/components/componentsState"
import { cloneDeep } from "lodash"

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

export const getActiveDataRect = (active: Active | null) => {
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
