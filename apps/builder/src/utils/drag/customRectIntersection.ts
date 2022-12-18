import type {
  CollisionDetection,
  ClientRect,
  CollisionDescriptor,
} from "@dnd-kit/core"

// function getIntersectionRatio(entry: LayoutRect, target: ViewRect): number {
//   const top = Math.max(target.top, entry.offsetTop)
//   const left = Math.max(target.left, entry.offsetLeft)
//   const right = Math.min(
//     target.left + target.width,
//     entry.offsetLeft + entry.width,
//   )
//   const bottom = Math.min(
//     target.top + target.height,
//     entry.offsetTop + entry.height,
//   )
//   const width = Math.abs(right - left)
//   const height = Math.abs(bottom - top)
//
//   if (left < right && top < bottom) {
//     const targetArea = target.width * target.height
//     const entryArea = entry.width * entry.height
//     const intersectionArea = width * height
//     const intersectionRatio =
//       intersectionArea / (targetArea + entryArea - intersectionArea)
//
//     const ratio = Number(intersectionRatio.toFixed(4))
//     return ratio
//   }
//
//   return 0
// }

function sortCollisionsDesc(
  { data: { value: a } }: CollisionDescriptor,
  { data: { value: b } }: CollisionDescriptor,
) {
  return b - a
}
export function getIntersectionRatio(
  entry: ClientRect,
  target: ClientRect,
): number {
  const top = Math.max(target.top, entry.top)
  const left = Math.max(target.left, entry.left)
  const right = Math.min(target.left + target.width, entry.left + entry.width)
  const bottom = Math.min(target.top + target.height, entry.top + entry.height)
  const width = right - left
  const height = bottom - top

  if (left < right && top < bottom) {
    const targetArea = target.width * target.height
    const entryArea = entry.width * entry.height
    const intersectionArea = width * height
    const intersectionRatio =
      intersectionArea / (targetArea + entryArea - intersectionArea)

    return Number(intersectionRatio.toFixed(4))
  }

  // Rectangles do not overlap, or overlap has an area of zero (edge/corner overlap)
  return 0
}

export const customRectIntersection: CollisionDetection = ({
  collisionRect,
  droppableRects,
  droppableContainers,
}) => {
  const collisions: CollisionDescriptor[] = []
  console.log("droppableContainers", droppableContainers)
  for (const droppableContainer of droppableContainers) {
    const { id } = droppableContainer
    const rect = droppableRects.get(id)

    if (rect) {
      const intersectionRatio = getIntersectionRatio(rect, collisionRect)

      if (intersectionRatio > 0) {
        collisions.push({
          id,
          data: { droppableContainer, value: intersectionRatio },
        })
      }
    }
  }

  return collisions.sort(sortCollisionsDesc)
}

// export const customRectIntersection: CollisionDetection = (args) => {
//   const { active, droppableContainers } = args
//   let maxIntersectionRatio = 0
//   let maxIntersectingDroppableContainer: UniqueIdentifier | null = null
//
//   const { translated } = active.rect.current
//
//   if (!translated) return maxIntersectingDroppableContainer
//   for (let i = 0; i < droppableContainers.length; i += 1) {
//     const droppableContainer = droppableContainers[i]
//     const {
//       rect: { current: rect },
//       node,
//     } = droppableContainer
//
//     if (rect) {
//       const computedRect = translated
//       computedRect.top += node.current?.scrollTop || 0
//       computedRect.bottom += node.current?.scrollTop || 0
//       const intersectionRatio = getIntersectionRatio(rect, computedRect)
//
//       if (intersectionRatio > maxIntersectionRatio) {
//         maxIntersectionRatio = intersectionRatio
//         maxIntersectingDroppableContainer = droppableContainer.id
//       }
//     }
//   }
//
//   return maxIntersectingDroppableContainer
// }
