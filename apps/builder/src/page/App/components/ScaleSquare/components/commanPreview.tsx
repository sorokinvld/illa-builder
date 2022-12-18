import { FC } from "react"
import {
  dashLinePreviewStyle,
  transparentBlockStyle,
} from "@/page/App/components/ScaleSquare/components/style"

interface IPreviewShapes {
  width: number
  height: number
}

interface TransparentBlockProps extends IPreviewShapes {
  canDrop: boolean
}

export const DashedLine: FC<IPreviewShapes> = (props) => {
  const { width, height } = props
  return <div css={dashLinePreviewStyle(width, height)} />
}

export const TransparentBlock: FC<TransparentBlockProps> = (props) => {
  const { width, height, canDrop } = props

  return <div css={transparentBlockStyle(width, height, canDrop)} />
}
