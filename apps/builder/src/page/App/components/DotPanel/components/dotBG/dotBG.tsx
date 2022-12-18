import { FC, useRef, MouseEvent } from "react"
import { UNIT_ROW_HEIGHT } from "@/page/App/components/DotPanel/components/dotBG/config"
import { IDotBGProps } from "@/page/App/components/DotPanel/components/dotBG/interface"
import { useDispatch, useSelector } from "react-redux"
import { isEditMode, isShowDot } from "@/redux/config/configSelector"
import { configActions } from "@/redux/config/configSlice"
import { applyComponentCanvasStyle } from "@/page/App/components/DotPanel/components/dotBG/style"

export const DotBG: FC<IDotBGProps> = (props) => {
  const { blockColumns, children, canvasRect } = props
  const isShowCanvasDot = useSelector(isShowDot)
  const isEdit = useSelector(isEditMode)
  const dispatch = useDispatch()
  const currentCanvasRef = useRef<HTMLDivElement | null>(null)

  const whenClickOnDotBg = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === currentCanvasRef.current && isEdit) {
      dispatch(configActions.updateSelectedComponent([]))
    }
  }

  return (
    <div
      ref={currentCanvasRef}
      css={applyComponentCanvasStyle(
        canvasRect.width,
        canvasRect.height,
        canvasRect.width / blockColumns,
        UNIT_ROW_HEIGHT,
        isShowCanvasDot,
      )}
      onClick={whenClickOnDotBg}
    >
      {children}
    </div>
  )
}

DotBG.displayName = "DotBG"
