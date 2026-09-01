import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'

export class AppError extends Error {
  statusCode: number
  errors?: Record<string, string>

  constructor(message: string, statusCode = 500, errors?: Record<string, string>) {
    super(message)
    this.statusCode = statusCode
    this.errors = errors
  }
}

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    const errors = Object.fromEntries(error.issues.map((issue) => [String(issue.path[0] ?? 'request'), issue.message]))
    res.status(400).json({ success: false, message: 'Validation failed', errors })
    return
  }

  const appError = error instanceof AppError ? error : undefined
  const statusCode = appError?.statusCode ?? 500
  const body: { success: false; message: string; errors?: Record<string, string> } = {
    success: false,
    message: appError?.message ?? 'Internal server error',
  }
  if (appError?.errors) body.errors = appError.errors
  res.status(statusCode).json(body)
}
