import { z } from 'zod'

export const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
export const siemTypeEnum = z.enum(['SENTINEL', 'CHRONICLE', 'OTHER'])

export const createUseCaseSchema = z.object({
  use_case_code: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  investigation_guide: z.string().optional(),
  priority: priorityEnum.default('MEDIUM'),
})

export const updateUseCaseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  investigation_guide: z.string().optional(),
  priority: priorityEnum.optional(),
})

export const useCaseLogSourcesSchema = z.object({
  log_source_ids: z.array(z.string().uuid()),
})

export const useCaseMitreSchema = z.object({
  technique_ids: z.array(z.string()),
})

export const useCaseQuerySchema = z.object({
  siem_type: siemTypeEnum,
  query_text: z.string(),
})

export const useCaseQueriesSchema = z.object({
  queries: z.array(useCaseQuerySchema),
})

export const createLogSourceSchema = z.object({
  name: z.string().min(1).max(100),
})

export const mitreSyncSchema = z.object({
  force: z.boolean().default(false),
})

export type CreateUseCaseInput = z.infer<typeof createUseCaseSchema>
export type UpdateUseCaseInput = z.infer<typeof updateUseCaseSchema>
export type UseCaseLogSourcesInput = z.infer<typeof useCaseLogSourcesSchema>
export type UseCaseMitreInput = z.infer<typeof useCaseMitreSchema>
export type UseCaseQueriesInput = z.infer<typeof useCaseQueriesSchema>
export type CreateLogSourceInput = z.infer<typeof createLogSourceSchema>
export type MitreSyncInput = z.infer<typeof mitreSyncSchema>
