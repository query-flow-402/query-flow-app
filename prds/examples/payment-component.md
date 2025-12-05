# Example: Payment Component

'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface PaymentFormProps {
onSubmit: (amount: number) => void
}

export default function PaymentForm({ onSubmit }: PaymentFormProps) {
const [amount, setAmount] = useState(0)

return (
<div className="p-6 bg-[#1a202e] rounded-lg">
<input
type="number"
value={amount}
onChange={(e) => setAmount(Number(e.target.value))}
className="w-full p-2 bg-[#0f1419] text-white rounded"
/>
<Button onClick={() => onSubmit(amount)}>
Submit
</Button>
</div>
)
}

text
