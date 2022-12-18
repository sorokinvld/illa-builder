import { FC, ReactNode, useCallback, useRef, useState } from "react"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"
import {
  MouseSensor,
  useSensor,
  useSensors,
  DndContext,
  DragOverlay,
  DragEndEvent,
  DragOverEvent,
  DragMoveEvent,
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
import {
  dragAndDropWhenAdd,
  dragAndDropWhenUpdate,
  dragAndDropWhenUpdateContainer,
} from "@/utils/drag/dragAndDrop"
import { generateComponentNode } from "@/utils/generators/generateComponentNode"
import { getReflowResult } from "@/page/App/components/DotPanel/calc"
import { DebounceUpdateReflow } from "@/page/App/components/DotPanel/interface"
import { cloneDeep, throttle } from "lodash"
import { ComponentNode } from "@/redux/currentApp/editor/components/componentsState"
import store from "@/store"
import { getFlattenArrayComponentNodes } from "@/redux/currentApp/editor/components/componentsSelector"
import {
  getActiveData,
  getActiveDataRect,
  getOverData,
  getOverId,
  getOverRect,
  isOverBoundingRect,
} from "@/utils/drag/utils"
import { getEventCoordinates } from "@dnd-kit/utilities"

interface ILLADndContextProps {
  children: ReactNode
}

export const ILLADndContext: FC<ILLADndContextProps> = (props) => {
  const { children } = props
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  })

  const [isActive, setIsActive] = useState(false)
  const [previewShape, setPreviewShape] = useState({
    w: 0,
    h: 0,
  })
  const [canDrop, setCanDrop] = useState(true)

  const dispatch = useDispatch()
  const [realTop, setRealTop] = useState(0)
  const [realLeft, setRealLeft] = useState(0)
  const [lunchTop, setLunchTop] = useState(0)
  const [lunchLeft, setLunchLeft] = useState(0)

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
      dispatch(configActions.updateShowDot(false))
      isActive && setIsActive(false)
      const { over, activatorEvent } = e
      if (
        e.active.data.current &&
        e.active.data.current.action === "UPDATE" &&
        over &&
        over.data.current
      ) {
        const {
          unitWidth,
          unitHeight,
          blockColumns: currentBlockColumns,
        } = over.data.current
        const { item, blockColumns: originBlockColumns } = e.active.data.current

        if (item.parentNode === e.over?.id) {
          dispatch(
            componentsActions.updateComponentNodePositionByDragReducer(
              dragAndDropWhenUpdate(item, e.delta, e.over),
            ),
          )
        } else {
          const newItem = {
            ...item,
            // @ts-ignore
            x: e.activatorEvent.x,
            // @ts-ignore
            y: e.activatorEvent.y,
          }
          const scale = currentBlockColumns / originBlockColumns

          const finalNode = dragAndDropWhenUpdateContainer(
            newItem,
            e.delta,
            e.over,
          )
          finalNode.w = Math.round(finalNode.w * scale)
          dispatch(
            componentsActions.updateComponentNodeParentNodeByDragReducer(
              finalNode,
            ),
          )
        }
      } else if (
        e.active.data.current &&
        e.active.data.current.action === "ADD"
      ) {
        const { dragInfo, widgetName } = e.active.data.current
        const item = generateComponentNode({
          widgetName,
          ...dragInfo,
        })
        const activeShape = getActiveDataRect(e.active)

        // @ts-ignore
        item.x = activeShape.left
        // @ts-ignore
        item.y = activeShape.top
        console.log("activeShape", item)
        const activatorCoordinates = getEventCoordinates(activatorEvent)
        if (activatorCoordinates) {
          const offSetX = activatorCoordinates.x - dragInfo.w * 0.5
          const newItem = dragAndDropWhenAdd(item, e.delta, e.over)
          // const item = e.active.data.current.item
          dispatch(componentsActions.addComponentReducer([newItem]))
        }
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
      const { active, over, delta } = e
      const activeData = getActiveData(active)
      const overRect = getOverRect(over)
      const overData = getOverData(over)
      const activeRect = getActiveDataRect(active)
      const overID = getOverId(over)
      if (activeData && overRect && overData && activeRect) {
        const isCanDrop = isOverBoundingRect(delta, activeRect, overRect)
        setCanDrop(isCanDrop)
      }

      if (activeData && activeData.action === "UPDATE" && overID) {
        const { item } = activeData
        const newItem = dragAndDropWhenUpdate(item, e.delta, e.over)
        const { finalState, effectResultMap } = getReflowResult(
          newItem,
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
        // @ts-ignore
        item.x = e.activatorEvent.x
        // @ts-ignore
        item.y = e.activatorEvent.y

        const newItem = dragAndDropWhenAdd(item, e.delta, e.over)
        console.log("newItem", newItem)
        const { finalState, effectResultMap } = getReflowResult(
          newItem,
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
    >
      {children}
      {createPortal(
        isActive && (
          <DragOverlay>
            <DashedLine
              width={previewShape.w}
              height={previewShape.h}
              left={lunchLeft}
              top={lunchTop}
            />
          </DragOverlay>
        ),
        document.body,
      )}
      {createPortal(
        isActive && (
          <DragOverlay>
            <TransparentBlock
              width={previewShape.w}
              height={previewShape.h}
              canDrop={canDrop}
              left={realLeft}
              top={realTop}
            />
          </DragOverlay>
        ),
        document.body,
      )}
    </DndContext>
  )
}
