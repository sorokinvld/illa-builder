import { FC, ReactNode, useMemo } from "react"
import { BasicContainer } from "@/widgetLibrary/BasicContainer/BasicContainer"
import { widgetBuilder } from "@/widgetLibrary/widgetBuilder"
import { ScaleSquare } from "@/page/App/components/ScaleSquare"
import { IRenderComponentProps } from "@/page/App/components/DotPanel/components/renderComponent/interface"
import { UNIT_ROW_HEIGHT } from "@/page/App/components/DotPanel/components/dotBG/config"

export const RenderComponent: FC<IRenderComponentProps> = (props) => {
  const {
    componentNode,
    unitWidth,
    rowNumber,
    canResizeY,
    minHeight,
    safeRowNumber,
    addedRowNumber,
    containerPadding,
    blockColumns,
    collisionEffect,
  } = props
  const childrenNode = componentNode.childrenNode
  return (
    <>
      {childrenNode?.map((item) => {
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
      })}
    </>
  )
}
