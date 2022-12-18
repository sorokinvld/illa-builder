import type { Modifier, ClientRect } from "@dnd-kit/core"
import type { Transform } from "@dnd-kit/utilities"
import { getActiveData, getOverData, getOverRect } from "@/utils/drag/utils"
import { getEventCoordinates } from "@dnd-kit/utilities"

export function restrictToBoundingRect(
  transform: Transform,
  rect: ClientRect,
  boundingRect: ClientRect,
): Transform {
  const value = {
    ...transform,
  }

  if (rect.top + transform.y <= boundingRect.top) {
    value.y = boundingRect.top - rect.top
  } else if (
    rect.bottom + transform.y >=
    boundingRect.top + boundingRect.height
  ) {
    value.y = boundingRect.top + boundingRect.height - rect.bottom
  }

  if (rect.left + transform.x <= boundingRect.left) {
    value.x = boundingRect.left - rect.left
  } else if (
    rect.right + transform.x >=
    boundingRect.left + boundingRect.width
  ) {
    value.x = boundingRect.left + boundingRect.width - rect.right
  }

  return value
}

export const restrictToTargetElement: Modifier = ({
  transform,
  draggingNodeRect,
}) => {
  const rootCanvas = document.querySelector("#rootCanvas")
  const rootCanvasRect = rootCanvas?.getBoundingClientRect()
  if (!draggingNodeRect || !rootCanvasRect) {
    return transform
  }

  return restrictToBoundingRect(transform, draggingNodeRect, rootCanvasRect)
}

export const snapToGrid: Modifier = ({
  transform,
  over,
  draggingNodeRect,
  active,
  activatorEvent,
}) => {
  const rootCanvas = document.querySelector("#rootCanvas")
  const rootCanvasRect = rootCanvas?.getBoundingClientRect()
  const overData = getOverData(over)
  const overRect = getOverRect(over)
  const activeData = getActiveData(active)

  console.log("activeData", activeData)
  if (
    !overData ||
    !draggingNodeRect ||
    !rootCanvasRect ||
    !overRect ||
    !activeData ||
    !activatorEvent
  ) {
    return transform
  }
  const activatorCoordinates = getEventCoordinates(activatorEvent)
  const { unitWidth, unitHeight } = overData
  const restrictTransform = restrictToBoundingRect(
    transform,
    draggingNodeRect,
    overRect,
  )
  let ceilTransform = {
    ...restrictTransform,
    x: Math.ceil(restrictTransform.x / unitWidth) * unitWidth,
    y: Math.ceil(restrictTransform.y / unitHeight) * unitHeight,
  }

  console.log("ceilTransform", ceilTransform)

  return ceilTransform
  // if (activeData.action === "ADD" && activatorCoordinates) {
  //   const { dragInfo } = activeData
  //   const realShape = {
  //     top: draggingNodeRect.top,
  //     left: draggingNodeRect.left,
  //     width: dragInfo.w * unitWidth,
  //     height: dragInfo.h * unitHeight,
  //   }
  //   console.log("realShape", realShape)
  //   const diffHeight = realShape.height - draggingNodeRect.height
  //   const diffWidth = realShape.width - draggingNodeRect.width
  //   console.log("diffHeight", diffHeight)
  //   console.log("diffWidth", diffWidth)
  //   const offsetY = activatorCoordinates.y - draggingNodeRect.top
  //   const offsetX = activatorCoordinates.x - draggingNodeRect.left
  //
  //   const realActivatorX =
  //     activatorCoordinates.x - realShape.width / 2 - draggingNodeRect.top
  //   const realActivatorY =
  //     activatorCoordinates.y - realShape.height / 2 - draggingNodeRect.left
  //
  //   const draggingRectCenterY = transform.y + realActivatorY
  //   const draggingRectCenterX = transform.x + realActivatorX
  //   const realShapeCenterX = realShape.height / 2
  //   const realShapeCenterY = realShape.width / 2
  //   return {
  //     ...transform,
  //     x: transform.x,
  //     y: transform.y + offsetY,
  //   }
  // }
  // return transform
}
