import { PROJECT_COLORS, type ProjectColor } from "@tickleaf/core"
import { useId } from "react"
import { ProjectDot } from "@/components/project-dot"
import { labels } from "@/lib/labels"
import { cn } from "@/lib/utils"

type ProjectColorPickerProps = {
  value: ProjectColor
  onChange: (color: ProjectColor) => void
  className?: string
}

export function ProjectColorPicker({ value, onChange, className }: ProjectColorPickerProps) {
  const name = useId()
  return (
    <fieldset className={cn("flex flex-wrap gap-1", className)}>
      <legend className="sr-only">{labels.nav.projectColor}</legend>
      {PROJECT_COLORS.map((color) => (
        <label
          key={color}
          title={labels.colors[color]}
          className="grid size-5 cursor-pointer place-items-center rounded-full has-checked:ring-2 has-checked:ring-ring has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-focus-visible:outline-ring"
        >
          <input
            type="radio"
            name={name}
            value={color}
            checked={value === color}
            onChange={() => onChange(color)}
            aria-label={labels.colors[color]}
            className="sr-only"
          />
          <ProjectDot color={color} className="size-3" />
        </label>
      ))}
    </fieldset>
  )
}
