import { mkdirSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const LEAF_PATHS = ["M4.5 19.5C4.5 10.5 10 4.5 19.5 4.5c0 9.5-6 15-15 15z", "M9 12.5l2.2 2.2 4.3-4.6"]

const publicDir = fileURLToPath(new URL("../public/", import.meta.url))
const iconsDir = fileURLToPath(new URL("../public/icons/", import.meta.url))

type IconSpec = { file: string; size: number; glyphRatio: number }

const PNG_ICONS: readonly IconSpec[] = [
  { file: "icon-192.png", size: 192, glyphRatio: 0.72 },
  { file: "icon-512.png", size: 512, glyphRatio: 0.72 },
  { file: "icon-maskable-512.png", size: 512, glyphRatio: 0.56 },
  { file: "apple-touch-icon.png", size: 180, glyphRatio: 0.66 },
]

function glyph(stroke: string): string {
  const paths = LEAF_PATHS.map((d) => `<path d="${d}"/>`).join("")
  return `<g fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`
}

function iconSvg({ size, glyphRatio }: IconSpec): string {
  const scale = (size * glyphRatio) / 24
  const offset = (size - size * glyphRatio) / 2
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<rect width="${size}" height="${size}" fill="#ffffff"/>`,
    `<g transform="translate(${offset} ${offset}) scale(${scale})">${glyph("#09090b")}</g>`,
    "</svg>",
  ].join("")
}

function faviconSvg(): string {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">',
    "<style>g{stroke:#09090b}@media (prefers-color-scheme: dark){g{stroke:#fafafa}}</style>",
    glyph("#09090b"),
    "</svg>",
    "",
  ].join("")
}

mkdirSync(iconsDir, { recursive: true })
for (const spec of PNG_ICONS) {
  await sharp(Buffer.from(iconSvg(spec)))
    .png()
    .toFile(`${iconsDir}${spec.file}`)
}
writeFileSync(`${publicDir}favicon.svg`, faviconSvg())
console.log(`${PNG_ICONS.length} icônes PNG et favicon.svg écrits dans ${publicDir}`)
