import { SerializedStyles, css } from "@emotion/react"

export const applyLabelAndComponentWrapperStyle = (
  labelPosition: "left" | "right" | "top" = "left",
): SerializedStyles => {
  if (labelPosition === "left") {
    return css`
      display: flex;
      align-items: center;
    `
  }
  if (labelPosition === "right") {
    return css`
      display: flex;
      flex-direction: row-reverse;
      align-items: center;
    `
  }
  return css``
}

export const applyWrapperSlider = (): SerializedStyles => {
  return css`
    display: flex;
    flex-direction: row;
    gap: 8px;
    align-items: center;
  `
}

export const applyIcon = (): SerializedStyles => {
  return css`
    height: 16px;
    width: 16px;
  `
}
