# Component Slicing Rules

## When to Split

**New component if:**
- Used 2+ times → `components/ui/`
- >50 lines JSX → split into smaller
- Has state/logic → separate file

**Keep inline if:**
- <20 lines
- Used once only
- No state

## File Organization

components/
├── ui/ # Reusable (Button, Input, Card)
└── features/ # Feature-specific (PaymentForm, QueryResults)

text

## Pattern

**Bad:**
function Page() {
return <div>{/* 200 lines */}</div>
}

text

**Good:**
function Page() {
return (
<>
<Header />
<Content />
<Footer />
</>
)
}

text

## Props

// ✅ Explicit
interface Props {
title: string
amount: number
}

// ❌ Avoid spreading
<Card {...everything} />

text
