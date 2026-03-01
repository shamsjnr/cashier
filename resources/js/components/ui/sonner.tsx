import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react"
import { Toaster as Sonner } from "sonner"
import { useEffect, useState } from "react"

type ToasterProps = React.ComponentProps<typeof Sonner>

function getTheme(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = useState<"light" | "dark">(getTheme)

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(getTheme()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CircleCheck className="h-4 w-4" />,
        info: <Info className="h-4 w-4" />,
        warning: <TriangleAlert className="h-4 w-4" />,
        error: <OctagonX className="h-4 w-4" />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
