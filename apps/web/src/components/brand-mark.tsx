import type { SVGProps } from "react"

export function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4.5 19.5C4.5 10.5 10 4.5 19.5 4.5c0 9.5-6 15-15 15z" />
      <path d="M9 12.5l2.2 2.2 4.3-4.6" />
    </svg>
  )
}
