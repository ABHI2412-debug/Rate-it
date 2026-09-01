import 'dotenv/config'

const required = (key: string) => {
  const value = process.env[key]
  if (!value) throw new Error(`${key} is required. Copy .env.example to .env and configure it.`)
  return value
}

export const config = {
  port: Number(process.env.PORT ?? 5000),
  jwtSecret: required('JWT_SECRET'),
  nodeEnv: process.env.NODE_ENV ?? 'development',
}
