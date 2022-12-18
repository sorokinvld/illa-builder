import { css } from "@emotion/react"
import { applyDotBackgroundStyle } from "@/page/App/components/DotPanel/style"

const normalCanvasBackgroundStyle = css`
  background: unset;
`
export const applyComponentCanvasStyle = (
  width: number,
  height: number,
  unitWidth: number,
  unitHeight: number = 8,
  showDot: boolean = false,
) => {
  return css`
    width: 100%;
    height: 100%;
    ${showDot
      ? applyDotBackgroundStyle(width, height, unitWidth, unitHeight)
      : normalCanvasBackgroundStyle}
    position: relative;
  `
}
