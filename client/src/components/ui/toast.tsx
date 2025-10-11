import * as React from "react"
import { toast as sonnerToast } from "sonner"

interface ToastProps {
  title?: string
  description?: string
  action?: React.ReactNode
}

export const toast = {
  success: (props: ToastProps | string) => {
    if (typeof props === "string") {
      return sonnerToast.success(props)
    }
    return sonnerToast.success(props.title, {
      description: props.description,
      action: props.action,
    })
  },
  error: (props: ToastProps | string) => {
    if (typeof props === "string") {
      return sonnerToast.error(props)
    }
    return sonnerToast.error(props.title, {
      description: props.description,
      action: props.action,
    })
  },
  info: (props: ToastProps | string) => {
    if (typeof props === "string") {
      return sonnerToast.info(props)
    }
    return sonnerToast.info(props.title, {
      description: props.description,
      action: props.action,
    })
  },
  warning: (props: ToastProps | string) => {
    if (typeof props === "string") {
      return sonnerToast.warning(props)
    }
    return sonnerToast.warning(props.title, {
      description: props.description,
      action: props.action,
    })
  },
}
