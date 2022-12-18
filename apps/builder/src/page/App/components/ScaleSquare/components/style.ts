import { css } from "@emotion/react"
import { getColor } from "@illa-design/react"

export const dashLinePreviewStyle = (width: number, height: number) => {
  return css`
    width: ${width}px;
    height: ${height}px;
    border: 1px dashed ${getColor("techPurple", "01")};
  `
}

export const transparentBlockStyle = (
  width: number,
  height: number,
  canDrop: boolean,
) => {
  return css`
    width: ${width}px;
    height: ${height}px;
    background-color: ${canDrop
      ? getColor("techPurple", "01")
      : getColor("red", "01")};
    opacity: 0.16;
  `
}
