import { PRIORITIES } from "@tickleaf/core"
import { z } from "zod"

export const PAYLOAD_VERSION = 3

const timestamp = z.iso.datetime()

const syncFields = {
  id: z.string().min(1),
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp.nullable(),
}

export const projectRowSchema = z.object({
  ...syncFields,
  name: z.string(),
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
  reminderAt: timestamp.nullable().default(null),
  priority: z.literal(PRIORITIES),
  projectId: z.string().nullable(),
  sectionId: z.string().nullable().default(null),
  position: z.number().int(),
  completedAt: timestamp.nullable(),
})

export const payloadHeaderSchema = z.object({ v: z.number().int() })

export const payloadSchema = z.object({
  v: z.number().int().min(1).max(PAYLOAD_VERSION),
  projects: z.array(projectRowSchema).default([]),
  sections: z.array(sectionRowSchema).default([]),
  tasks: z.array(taskRowSchema).default([]),
})

export type ProjectRowPayload = z.infer<typeof projectRowSchema>
export type SectionRowPayload = z.infer<typeof sectionRowSchema>
export type TaskRowPayload = z.infer<typeof taskRowSchema>
export type SyncPayload = z.infer<typeof payloadSchema>
