# API Design Rules

## Endpoints

POST /api/query - Submit query
GET /api/query/:id - Get result
GET /api/price - Calculate price

text

## Response Format

**Always:**
// Success
{ success: true, data: any, timestamp: number }

// Error
{ success: false, error: { code: string, message: string }, timestamp: number }

text

## Validation

import { z } from 'zod'

const Schema = z.object({
query: z.string().min(1).max(1000),
amount: z.number().positive()
})

const validated = Schema.parse(req.body)

text

## Error Handling

router.post('/query', async (req, res, next) => {
try {
const result = await service.process(req.body)
res.json({ success: true, data: result, timestamp: Date.now() })
} catch (error) {
next(error)
}
})

text

## Service Layer

routes/ # HTTP only
services/ # Business logic
middleware/ # Cross-cutting

text
