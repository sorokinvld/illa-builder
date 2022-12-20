import { FC, ReactNode, useCallback, useRef, useState } from "react"
import { restrictToWindowEdges, snapCenterToCursor } from "@dnd-kit/modifiers"
import {
  MouseSensor,
  useSensor,
  useSensors,
  DndContext,
  DragOverlay,
  DragEndEvent,
  DragOverEvent,
  DragMoveEvent,
  pointerWithin,
} from "@dnd-kit/core"
import { createPortal } from "react-dom"
import {
  restrictToTargetElement,
  snapToGrid,
} from "@/utils/drag/restrictToTargetElement"
import { DragStartEvent } from "@dnd-kit/core/dist/types"
import { useDispatch } from "react-redux"
import { configActions } from "@/redux/config/configSlice"
import {
  DashedLine,
  TransparentBlock,
} from "@/page/App/components/ScaleSquare/components/commanPreview"
import { componentsActions } from "@/redux/currentApp/editor/components/componentsSlice"
import { getDraggingRect } from "@/utils/drag/dragAndDrop"
import { generateComponentNode } from "@/utils/generators/generateComponentNode"
import { getReflowResult } from "@/page/App/components/DotPanel/calc"
import { DebounceUpdateReflow } from "@/page/App/components/DotPanel/interface"
import { cloneDeep, throttle } from "lodash"
import { ComponentNode } from "@/redux/currentApp/editor/components/componentsState"
import store from "@/store"
import { getFlattenArrayComponentNodes } from "@/redux/currentApp/editor/components/componentsSelector"
import {
  getActiveData,
  getActiveRect,
  getOverData,
  getOverId,
  getOverRect,
  getRealComponentNodePosition,
  isOverBoundingRect,
  isOverBoundingRectByComponentNode,
} from "@/utils/drag/utils"
import { getEventCoordinates } from "@dnd-kit/utilities"

interface ILLADndContextProps {
  children: ReactNode
}

export const ILLADndContext: FC<ILLADndContextProps> = (props) => {
  const { children } = props
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  })

  const [isActive, setIsActive] = useState(false)
  const [previewShape, setPreviewShape] = useState({
    w: 0,
    h: 0,
  })
  const [canDrop, setCanDrop] = useState(true)
  const originContainerRect = useRef()

  const dispatch = useDispatch()

  const sensors = useSensors(mouseSensor)
  const allChildrenNodesRef = useRef<ComponentNode[]>([])

  const onDragStart = useCallback(
    (e: DragStartEvent) => {
      const rootState = store.getState()
      const allComponentNodes = getFlattenArrayComponentNodes(rootState)
      allChildrenNodesRef.current = allComponentNodes
        ? cloneDeep(allComponentNodes)
        : []
      dispatch(configActions.updateShowDot(true))
    },
    [dispatch],
  )

  const onDragOver = useCallback((e: DragOverEvent) => {
    const { over, active } = e
    if (over) {
      setIsActive(true)
    } else {
      setIsActive(false)
    }
    if (active.data.current && over?.data.current) {
      const {
        unitWidth,
        unitHeight,
        blockColumns: currentBlockColumns,
      } = over.data.current
      if (active.data.current.action === "UPDATE") {
        const { item, blockColumns: originBlockColumns } = active.data.current
        const scale = currentBlockColumns / originBlockColumns
        setPreviewShape({
          w: item.w * unitWidth * scale,
          h: item.h * unitHeight,
        })
      }
      if (active.data.current.action === "ADD") {
        const { dragInfo } = active.data.current
        setPreviewShape({
          w: dragInfo.w * unitWidth,
          h: dragInfo.h * unitHeight,
        })
      }
    }
  }, [])

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      console.log("e", e)
      dispatch(configActions.updateShowDot(false))
      isActive && setIsActive(false)
      const { over, activatorEvent, active, delta } = e
      const activeData = getActiveData(active)
      const overData = getOverData(over)
      if (activeData && activeData.action === "UPDATE" && overData) {
        const {
          unitWidth,
          unitHeight,
          blockColumns: currentBlockColumns,
        } = overData
        const { item, blockColumns: originBlockColumns } = activeData
        const realItem = getRealComponentNodePosition(
          item,
          delta,
          over,
          active,
          activatorEvent as MouseEvent,
        )
        if (item.parentNode === e.over?.id) {
          dispatch(
            componentsActions.updateComponentNodePositionByDragReducer(
              realItem,
            ),
          )
        } else {
          const scale = currentBlockColumns / originBlockColumns

          realItem.w = Math.round(realItem.w * scale)
          dispatch(
            componentsActions.updateComponentNodeParentNodeByDragReducer(
              realItem,
            ),
          )
        }
      } else if (activeData && activeData.action === "ADD") {
        const { dragInfo, widgetName } = activeData
        const item = generateComponentNode({
          widgetName,
          ...dragInfo,
        })
        const realItem = getRealComponentNodePosition(
          item,
          delta,
          over,
          active,
          activatorEvent as MouseEvent,
        )

        dispatch(componentsActions.addComponentReducer([realItem]))
      }
    },
    [dispatch, isActive],
  )

  const updateComponentPositionByReflow = useCallback(
    (updateSlice: DebounceUpdateReflow[]) => {
      dispatch(componentsActions.updateComponentReflowReducer(updateSlice))
    },
    [dispatch],
  )

  const debounceUpdateComponentPositionByReflow = throttle(
    updateComponentPositionByReflow,
    60,
  )

  const onDragMove = useCallback(
    (e: DragMoveEvent) => {
      console.log("dragMoveEvnet", e)
      const { active, over, delta, activatorEvent } = e
      const activeData = getActiveData(active)
      const overRect = getOverRect(over)
      const overData = getOverData(over)
      const activeRect = getActiveRect(active)
      const overID = getOverId(over)
      if (
        activeData &&
        overRect &&
        overData &&
        activeRect &&
        activeData.action === "UPDATE"
      ) {
        console.log("over", over)
        const itemShape = getDraggingRect(activeData.item, delta, over)
        console.log("itemShape", itemShape)
        const isCanDrop = isOverBoundingRectByComponentNode(itemShape, overRect)
        // const isCanDrop = isOverBoundingRect(delta, activeRect, overRect)
        setCanDrop(isCanDrop)
      }

      if (activeData && activeData.action === "UPDATE" && overID) {
        const { item } = activeData
        const realItem = getRealComponentNodePosition(
          item,
          delta,
          over,
          active,
          activatorEvent as MouseEvent,
        )

        const { finalState, effectResultMap } = getReflowResult(
          realItem,
          allChildrenNodesRef.current,
        )
        const updateSlice = [
          {
            parentDisplayName: overID || "root",
            childNodes: finalState,
          },
        ]
        debounceUpdateComponentPositionByReflow(updateSlice)
      }
      if (activeData && activeData.action === "ADD" && overID) {
        const { widgetName, dragInfo } = activeData
        const item = generateComponentNode({
          widgetName,
          ...dragInfo,
        })
        const realItem = getRealComponentNodePosition(
          item,
          delta,
          over,
          active,
          activatorEvent as MouseEvent,
        )

        const { finalState, effectResultMap } = getReflowResult(
          realItem,
          allChildrenNodesRef.current,
        )
        const updateSlice = [
          {
            parentDisplayName: overID || "root",
            childNodes: finalState,
          },
        ]
        debounceUpdateComponentPositionByReflow(updateSlice)
      }
    },
    [debounceUpdateComponentPositionByReflow],
  )

  return (
    <DndContext
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragMove={onDragMove}
      sensors={sensors}
      collisionDetection={pointerWithin}
    >
      {children}
      {createPortal(
        <DragOverlay
          // modifiers={[snapCenterToCursor, snapToGrid]}
          dropAnimation={null}
        >
          {isActive && (
            <DashedLine width={previewShape.w} height={previewShape.h} />
          )}
        </DragOverlay>,
        document.body,
      )}
      {createPortal(
        <DragOverlay
          dropAnimation={null}
          // modifiers={[snapCenterToCursor]}
        >
          {isActive && (
            <TransparentBlock
              width={previewShape.w}
              height={previewShape.h}
              canDrop={canDrop}
            />
          )}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  )
}
