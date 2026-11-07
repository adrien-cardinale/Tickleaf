import {
  DEFAULT_PROJECT_COLOR,
  MAX_RECURRENCE_INTERVAL,
  PRIORITIES,
  PROJECT_COLORS,
  RECURRENCE_UNITS,
} from "@tickleaf/core"
import { z } from "zod"

export const PAYLOAD_VERSION = 10

const timestamp = z.iso.datetime()

const dueTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)

const syncFields = {
  id: z.string().min(1),
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp.nullable(),
}

const recurrenceSchema = z.object({
  unit: z.enum(RECURRENCE_UNITS),
  interval: z.number().int().min(1).max(MAX_RECURRENCE_INTERVAL),
})

const placeFields = {
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().positive(),
  label: z.string(),
}

const placeSchema = z.object(placeFields)

export const projectRowSchema = z.object({
  ...syncFields,
  name: z.string(),
  color: z.enum(PROJECT_COLORS).catch(DEFAULT_PROJECT_COLOR),
  parentId: z.string().nullable().default(null),
  position: z.number().int(),
  archivedAt: timestamp.nullable(),
})

export const sectionRowSchema = z.object({
  ...syncFields,
  projectId: z.string().min(1),
  name: z.string(),
  position: z.number().int(),
})

export const taskRowSchema = z.object({
  ...syncFields,
  title: z.string(),
  description: z.string(),
  due: z.string().nullable(),
  dueTime: dueTime.nullable().default(null),
  dueTimeZone: z.string().min(1).nullable().default(null),
  reminderAt: timestamp.nullable().default(null),
  recurrence: recurrenceSchema.nullable().default(null),
  place: placeSchema.nullable().default(null),
  priority: z.literal(PRIORITIES),
  projectId: z.string().nullable(),
  sectionId: z.string().nullable().default(null),
  parentId: z.string().nullable().default(null),
  position: z.number().int(),
  completedAt: timestamp.nullable(),
})

export const favoritePlaceRowSchema = z.object({
  ...syncFields,
  ...placeFields,
  radius: z.number().int().positive(),
  position: z.number().int(),
})

export const payloadHeaderSchema = z.object({ v: z.number().int() })

export const payloadSchema = z.object({
  v: z.number().int().min(1).max(PAYLOAD_VERSION),
  projects: z.array(projectRowSchema).default([]),
  sections: z.array(sectionRowSchema).default([]),
  tasks: z.array(taskRowSchema).default([]),
  favoritePlaces: z.array(favoritePlaceRowSchema).default([]),
})

export type ProjectRowPayload = z.infer<typeof projectRowSchema>
export type SectionRowPayload = z.infer<typeof sectionRowSchema>
export type TaskRowPayload = z.infer<typeof taskRowSchema>
export type FavoritePlaceRowPayload = z.infer<typeof favoritePlaceRowSchema>
export type SyncPayload = z.infer<typeof payloadSchema>
