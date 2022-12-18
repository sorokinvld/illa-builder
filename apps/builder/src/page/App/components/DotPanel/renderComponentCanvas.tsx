import { throttle } from "lodash"
import {
  FC,
  MutableRefObject,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  ElementRef,
} from "react"
import { useDrop } from "react-dnd"
import { useDispatch, useSelector } from "react-redux"
import useMeasure from "react-use-measure"
import {
  getDragResult,
  getReflowResult,
  isAddAction,
} from "@/page/App/components/DotPanel/calc"
import { FreezePlaceholder } from "@/page/App/components/DotPanel/freezePlaceholder"
import {
  DebounceUpdateReflow,
  DragInfo,
  DropCollectedInfo,
  DropResultInfo,
} from "@/page/App/components/DotPanel/interface"
import { PreviewPlaceholder } from "@/page/App/components/DotPanel/previewPlaceholder"
import {
  applyComponentCanvasSizeStyle,
  borderLineStyle,
  dropWrapperStyle,
} from "@/page/App/components/DotPanel/style"
import { ScaleSquare } from "@/page/App/components/ScaleSquare"
import {
  getFreezeState,
  getIllaMode,
  isShowDot,
} from "@/redux/config/configSelector"
import { configActions } from "@/redux/config/configSlice"
import { componentsActions } from "@/redux/currentApp/editor/components/componentsSlice"
import { ComponentNode } from "@/redux/currentApp/editor/components/componentsState"
import { BasicContainer } from "@/widgetLibrary/BasicContainer/BasicContainer"
import { ContainerEmptyState } from "@/widgetLibrary/ContainerWidget/emptyState"
import { widgetBuilder } from "@/widgetLibrary/widgetBuilder"
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"
import { createPortal } from "react-dom"
import { DotBG } from "@/page/App/components/DotPanel/components/dotBG/dotBG"
import {
  BASIC_COLUMNS,
  UNIT_ROW_HEIGHT,
} from "@/page/App/components/DotPanel/components/dotBG/config"

export const RenderComponentCanvas: FC<{
  componentNode: ComponentNode
  containerRef: RefObject<HTMLDivElement>
  containerPadding: number
  minHeight?: number
  canResizeY?: boolean
  safeRowNumber: number
  blockColumns?: number
  addedRowNumber: number
  canAutoScroll?: boolean
}> = (props) => {
  const {
    componentNode,
    containerRef,
    containerPadding,
    minHeight,
    canResizeY = true,
    safeRowNumber,
    blockColumns = BASIC_COLUMNS,
    addedRowNumber,
    canAutoScroll = false,
  } = props
  const [canvasRef, bounds] = useMeasure()
  const unitWidth = bounds.width / blockColumns

  const { isOver, setNodeRef } = useDroppable({
    id: componentNode.displayName,
    data: {
      unitWidth: unitWidth,
      unitHeight: UNIT_ROW_HEIGHT,
      blockColumns,
    },
  })
  const isShowCanvasDot = useSelector(isShowDot)
  const illaMode = useSelector(getIllaMode)
  const isFreezeCanvas = useSelector(getFreezeState)
  const dispatch = useDispatch()

  const [rowNumber, setRowNumber] = useState(0)

  const [collisionEffect, setCollisionEffect] = useState(
    new Map<string, ComponentNode>(),
  )

  const componentTree = useMemo<ReactNode>(() => {
    const childrenNode = componentNode.childrenNode
    return childrenNode?.map<ReactNode>((item) => {
      const h = item.h * UNIT_ROW_HEIGHT
      const w = item.w * unitWidth
      const x = item.x * unitWidth
      const y = item.y * UNIT_ROW_HEIGHT

      const containerHeight =
        componentNode.displayName === "root"
          ? rowNumber * UNIT_ROW_HEIGHT
          : (componentNode.h - 1) * UNIT_ROW_HEIGHT
      switch (item.containerType) {
        case "EDITOR_DOT_PANEL":
          return (
            <BasicContainer
              componentNode={item}
              key={item.displayName}
              canResizeY={canResizeY}
              minHeight={minHeight}
              safeRowNumber={safeRowNumber}
              addedRowNumber={addedRowNumber}
            />
          )
        case "EDITOR_SCALE_SQUARE":
          const widget = widgetBuilder(item.type)
          if (!widget) return null
          return (
            <ScaleSquare
              key={item.displayName}
              componentNode={item}
              h={h}
              w={w}
              x={x}
              y={y}
              unitW={unitWidth}
              unitH={UNIT_ROW_HEIGHT}
              containerHeight={containerHeight}
              containerPadding={containerPadding}
              childrenNode={componentNode.childrenNode}
              collisionEffect={collisionEffect}
              columnsNumber={blockColumns}
            />
          )
        default:
          return null
      }
    })
  }, [
    addedRowNumber,
    blockColumns,
    canResizeY,
    collisionEffect,
    componentNode.childrenNode,
    componentNode.displayName,
    componentNode.h,
    containerPadding,
    minHeight,
    rowNumber,
    safeRowNumber,
    unitWidth,
  ])

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

  // const [{ isActive, nodeWidth, nodeHeight }, dropTarget] = useDrop<
  //   DragInfo,
  //   DropResultInfo,
  //   DropCollectedInfo
  // >(
  //   () => ({
  //     accept: ["components"],
  //     canDrop: () => {
  //       return illaMode === "edit"
  //     },
  //     hover: (dragInfo, monitor) => {
  //       if (!monitor.isOver({ shallow: true })) {
  //         setCollisionEffect(new Map())
  //       }
  //       if (monitor.isOver({ shallow: true }) && monitor.getClientOffset()) {
  //         const { item, currentColumnNumber } = dragInfo
  //         const scale = blockColumns / currentColumnNumber
  //
  //         const scaleItem: ComponentNode = {
  //           ...item,
  //           w: item.w * scale,
  //         }
  //         let dragResult
  //         if (
  //           isAddAction(
  //             item.x,
  //             item.y,
  //             item.parentNode,
  //             componentNode.displayName,
  //           )
  //         ) {
  //           dragResult = getDragResult(
  //             monitor,
  //             containerRef,
  //             scaleItem,
  //             unitWidth,
  //             UNIT_ROW_HEIGHT,
  //             bounds.width,
  //             "ADD",
  //             bounds.height,
  //             canResizeY,
  //           )
  //         } else {
  //           dragResult = getDragResult(
  //             monitor,
  //             containerRef,
  //             item,
  //             unitWidth,
  //             UNIT_ROW_HEIGHT,
  //             bounds.width,
  //             "UPDATE",
  //             bounds.height,
  //             canResizeY,
  //           )
  //         }
  //         const { ladingPosition, rectCenterPosition } = dragResult
  //         const { landingX, landingY, isOverstep } = ladingPosition
  //
  //         /**
  //          * add rows when node over canvas
  //          */
  //         if (
  //           canResizeY &&
  //           landingY / UNIT_ROW_HEIGHT + item.h > rowNumber - safeRowNumber
  //         ) {
  //           const finalNumber = landingY / UNIT_ROW_HEIGHT + item.h + safeRowNumber
  //           setRowNumber(finalNumber)
  //         }
  //
  //         let childrenNodes = dragInfo.childrenNodes.filter(
  //           (node) => node.parentNode === componentNode.displayName,
  //         )
  //         const indexOfChildrenNodes = childrenNodes.findIndex(
  //           (node) => node.displayName === item.displayName,
  //         )
  //         let finalChildrenNodes: ComponentNode[] = []
  //         let finalEffectResultMap: Map<string, ComponentNode> = new Map()
  //         /**
  //          * generate component node with new position
  //          */
  //         const oldParentDisplayName = item.parentNode
  //         const newItem = {
  //           ...scaleItem,
  //           parentNode: componentNode.displayName || "root",
  //           x: Math.round(landingX / unitWidth),
  //           y: Math.round(landingY / UNIT_ROW_HEIGHT),
  //           unitW: unitWidth,
  //           unitH: UNIT_ROW_HEIGHT,
  //         }
  //
  //         /**
  //          * only when add component nodes
  //          */
  //         if (indexOfChildrenNodes === -1) {
  //           const allChildrenNodes = [...childrenNodes, newItem]
  //           const { finalState, effectResultMap } = getReflowResult(
  //             newItem,
  //             allChildrenNodes,
  //           )
  //           finalChildrenNodes = finalState
  //           finalEffectResultMap = effectResultMap
  //         } else {
  //           const indexOfChildren = childrenNodes.findIndex(
  //             (node) => node.displayName === newItem.displayName,
  //           )
  //           const allChildrenNodes = [...childrenNodes]
  //           allChildrenNodes.splice(indexOfChildren, 1, newItem)
  //           const { finalState, effectResultMap } = getReflowResult(
  //             newItem,
  //             allChildrenNodes,
  //           )
  //           finalChildrenNodes = finalState
  //           finalEffectResultMap = effectResultMap
  //         }
  //         if (!isFreezeCanvas) {
  //           const updateSlice = [
  //             {
  //               parentDisplayName: componentNode.displayName || "root",
  //               childNodes: finalChildrenNodes,
  //             },
  //           ]
  //
  //           if (newItem.parentNode !== oldParentDisplayName) {
  //             let oldParentChildNodes = dragInfo.childrenNodes.filter(
  //               (node) => node.parentNode === oldParentDisplayName,
  //             )
  //             if (oldParentChildNodes.length > 0) {
  //               const indexOfOldChildren = oldParentChildNodes.findIndex(
  //                 (node) => node.displayName === newItem.displayName,
  //               )
  //               const allChildrenNodes = [...oldParentChildNodes]
  //               if (indexOfChildrenNodes !== -1) {
  //                 allChildrenNodes.splice(indexOfOldChildren, 1, newItem)
  //               }
  //               updateSlice.push({
  //                 parentDisplayName: oldParentDisplayName as string,
  //                 childNodes: allChildrenNodes,
  //               })
  //             }
  //           }
  //           debounceUpdateComponentPositionByReflow(updateSlice)
  //           setCollisionEffect(new Map())
  //         } else {
  //           setCollisionEffect(finalEffectResultMap)
  //         }
  //         setXY([rectCenterPosition.x, rectCenterPosition.y])
  //         setLunchXY([landingX, landingY])
  //         setCanDrop(isOverstep)
  //       }
  //     },
  //     drop: (dragInfo, monitor) => {
  //       const isDrop = monitor.didDrop()
  //       const { item, currentColumnNumber } = dragInfo
  //       if (isDrop || item.displayName === componentNode.displayName) return
  //       if (monitor.getClientOffset()) {
  //         const scale = blockColumns / currentColumnNumber
  //
  //         const scaleItem: ComponentNode = {
  //           ...item,
  //           w: item.w * scale,
  //         }
  //         let dragResult
  //         if (
  //           isAddAction(
  //             item.x,
  //             item.y,
  //             item.parentNode,
  //             componentNode.displayName,
  //           )
  //         ) {
  //           dragResult = getDragResult(
  //             monitor,
  //             containerRef,
  //             scaleItem,
  //             unitWidth,
  //             UNIT_ROW_HEIGHT,
  //             bounds.width,
  //             "ADD",
  //             bounds.height,
  //             canResizeY,
  //           )
  //         } else {
  //           dragResult = getDragResult(
  //             monitor,
  //             containerRef,
  //             scaleItem,
  //             unitWidth,
  //             UNIT_ROW_HEIGHT,
  //             bounds.width,
  //             "UPDATE",
  //             bounds.height,
  //             canResizeY,
  //           )
  //         }
  //         const { ladingPosition } = dragResult
  //         const { landingX, landingY } = ladingPosition
  //
  //         /**
  //          * generate component node with new position
  //          */
  //         const oldParentNodeDisplayName = item.parentNode || "root"
  //         const newItem = {
  //           ...scaleItem,
  //           parentNode: componentNode.displayName || "root",
  //           x: Math.round(landingX / unitWidth),
  //           y: Math.round(landingY / UNIT_ROW_HEIGHT),
  //           unitW: unitWidth,
  //           unitH: UNIT_ROW_HEIGHT,
  //           isDragging: false,
  //         }
  //
  //         /**
  //          * add new nodes
  //          */
  //         if (item.x === -1 && item.y === -1) {
  //           dispatch(componentsActions.addComponentReducer([newItem]))
  //         } else {
  //           /**
  //            * update node when change container
  //            */
  //           if (oldParentNodeDisplayName !== componentNode.displayName) {
  //             dispatch(
  //               componentsActions.updateComponentContainerReducer({
  //                 isMove: false,
  //                 updateSlice: [
  //                   {
  //                     component: newItem,
  //                     oldParentDisplayName: oldParentNodeDisplayName,
  //                   },
  //                 ],
  //               }),
  //             )
  //           } else {
  //             dispatch(
  //               componentsActions.updateComponentsShape({
  //                 isMove: false,
  //                 components: [newItem],
  //               }),
  //             )
  //           }
  //         }
  //         setCollisionEffect(new Map())
  //         return {
  //           isDropOnCanvas: true,
  //         }
  //       }
  //       return {
  //         isDropOnCanvas: false,
  //       }
  //     },
  //     collect: (monitor) => {
  //       const dragInfo = monitor.getItem()
  //       if (!dragInfo) {
  //         return {
  //           isActive: monitor.canDrop() && monitor.isOver({ shallow: true }),
  //           nodeWidth: 0,
  //           nodeHeight: 0,
  //         }
  //       }
  //       const { item, currentColumnNumber } = dragInfo
  //       let nodeWidth = item?.w ?? 0
  //       let nodeHeight = item?.h ?? 0
  //       nodeWidth = nodeWidth * (blockColumns / currentColumnNumber)
  //       return {
  //         isActive: monitor.canDrop() && monitor.isOver({ shallow: true }),
  //         nodeWidth: nodeWidth,
  //         nodeHeight: nodeHeight,
  //       }
  //     },
  //   }),
  //   [bounds, unitWidth, UNIT_ROW_HEIGHT, canDrop, isFreezeCanvas, componentNode],
  // )

  const maxY = useMemo(() => {
    let maxY = 0
    componentNode.childrenNode?.forEach((node) => {
      maxY = Math.max(maxY, node.y + node.h)
    })
    return maxY
  }, [componentNode.childrenNode])

  const finalRowNumber = useMemo(() => {
    return Math.max(
      maxY,
      Math.floor((minHeight || document.body.clientHeight) / UNIT_ROW_HEIGHT),
    )
  }, [maxY, minHeight])

  useEffect(() => {
    if (canResizeY) {
      if (illaMode === "edit") {
        if (
          finalRowNumber === maxY &&
          finalRowNumber + addedRowNumber >= rowNumber
        ) {
          setRowNumber(finalRowNumber + addedRowNumber)
          // if (
          //   canAutoScroll &&
          //   rowNumber !== 0 &&
          //   finalRowNumber + addedRowNumber !== rowNumber
          // ) {
          //   clearTimeout(autoScrollTimeoutID.current)
          //   autoScrollTimeoutID.current = setTimeout(() => {
          //     containerRef.current?.scrollBy({
          //       top: (addedRowNumber * UNIT_ROW_HEIGHT) / 4,
          //       behavior: "smooth",
          //     })
          //   }, 60)
          // }
        } else {
          setRowNumber(finalRowNumber)
        }
      } else {
        setRowNumber(maxY)
      }
    }
  }, [
    addedRowNumber,
    canAutoScroll,
    canResizeY,
    containerRef,
    finalRowNumber,
    illaMode,
    maxY,
    rowNumber,
  ])

  if (
    componentNode.type === "CANVAS" &&
    (!Array.isArray(componentNode.childrenNode) ||
      componentNode.childrenNode.length === 0) &&
    !isShowCanvasDot
  ) {
    return <ContainerEmptyState />
  }

  return (
    <>
      <div
        ref={canvasRef}
        css={applyComponentCanvasSizeStyle(rowNumber * 8, minHeight)}
      >
        <div
          ref={setNodeRef}
          css={dropWrapperStyle}
          id={componentNode.displayName}
        >
          <DotBG
            blockColumns={blockColumns}
            rowNumber={rowNumber}
            canvasRect={bounds}
          >
            {componentTree}
            {isShowCanvasDot && <div css={borderLineStyle} />}
            {/*<FreezePlaceholder*/}
            {/*  effectMap={collisionEffect}*/}
            {/*  unitW={unitWidth}*/}
            {/*  unitH={UNIT_ROW_HEIGHT}*/}
            {/*/>*/}
          </DotBG>
        </div>
      </div>
    </>
  )
}
