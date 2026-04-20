# Windowed Queries

A windowed expression constrains a condition with a time boundary using the `@` operator. It requires the evaluation context to implement `IWindowedEvalContext` and a valid time source.

```
Condition @ WindowSuffix
```

## Duration mode

In duration mode, the inner condition must be *continuously* true for a duration within the given bounds:

```
Health < 20 @ [3,]          // in critical health for at least 3 time units
A > 5 @ [3, 10]             // A > 5 for between 3 and 10 time units
IsStunned = True @ [,5]     // stunned for at most 5 time units
```

The clock starts the moment `Evaluate()` is first called with the inner condition true. If the inner condition becomes false before the lower bound is reached, the clock resets.

## Window mode — LAST and NOW

Window mode checks whether the condition was true at *any point* within an absolute time range, using `LAST` or `NOW`:

```
Phase = "combat" @ LAST 4h              // in combat at any point in the last 4 hours
A > 5 @ [NOW - 30, NOW]                 // was true in the last 30 time units
Health < 20 @ [NOW - 1h, NOW - 10m]     // was critical between 10 min and 1 h ago
```

`LAST 4h` is shorthand for `[NOW - 4h, NOW]` inclusive. `NOW` resolves to `IEvalContext.GetCurrentTime()` at evaluation time.

## Grouping — single term vs compound expression

A single-term condition needs no extra parens:

```
A > 5 @ [3,]
IsStunned = True @ [3,]
```

For compound expressions, wrap the condition in parentheses:

```
(Health < 20 && IsAlive = True) @ [3,]
(Phase = "combat" || Phase = "chase") @ LAST 10m
```

## Inclusive and exclusive bounds

Bounds use the same bracket syntax as `IN`:

| Syntax | Meaning |
|--------|---------|
| `[lo, hi]` | lo ≤ duration ≤ hi |
| `(lo, hi)` | lo < duration < hi |
| `[lo, hi)` | lo ≤ duration < hi |
| `(lo, hi]` | lo < duration ≤ hi |
| `[lo,]` | duration ≥ lo (no upper bound) |
| `[,hi]` | duration ≤ hi (no lower bound) |

```
A > 5 @ [3, 10)    // 3 ≤ duration < 10
```

## Duration literals

Duration suffixes are resolved by the context. The default mapping in `SimpleEvalContext` is:

| Suffix | Default value |
|--------|--------------|
| `ms` | 0.001 s |
| `s` | 1 s |
| `m` | 60 s |
| `h` | 3 600 s |
| `d` | 86 400 s |

Multiple units chain without spaces: `1d2h30m` = 1 day + 2 hours + 30 minutes.

For game time or tick-based time, provide a custom `SetDurationResolver()` on your context.

## Scheduled re-evaluation and NextScheduledEvaluationTime

Windowed expressions do **not** need to re-evaluate on every time tick. After each `Evaluate()` call, `QuerySession.NextScheduledEvaluationTime` tells the reactive layer exactly when to re-evaluate next — when a boundary may be crossed.

```csharp
// On blackboard key change — always re-evaluate
void OnKeyChanged(string key) => session.Evaluate(ctx);

// On time tick — only re-evaluate when a boundary is crossed
void OnTick(double currentTime)
{
    if (session.NextScheduledEvaluationTime is double next && currentTime >= next)
        session.Evaluate(ctx);
}
```

::: tip Performance
Subscribe to a clock key on the blackboard and bail out early using `NextScheduledEvaluationTime`. This avoids re-evaluating the full query on every frame or tick when no windowed boundary has been crossed.
:::

::: info State model
A windowed interval opens the moment `Evaluate()` is called with the inner condition true. For accurate durations, call `Evaluate()` immediately after setting relevant blackboard keys — not just on time ticks.
:::

## Full examples

```
// Stunned for at least 3 seconds
IsStunned = True @ [3,]

// Was in combat at any point in the last 10 minutes
Phase = "combat" @ LAST 10m

// In critical health for exactly 2–5 seconds (alarm window)
Health < 20 @ [2, 5]

// Boss fight lasted between 30s and 2 minutes
Phase = "boss" @ [30s, 2m]

// Was true at any point in the last 4 hours
A > 5 @ LAST 4h

// Was true in the last 30 time units (absolute window)
A > 5 @ [NOW - 30, NOW]

// Was critical between 10 minutes and 1 hour ago
Health < 20 @ [NOW - 1h, NOW - 10m]

// Compound: critical AND alive, for at least 3 time units
(Health < 20 && IsAlive = True) @ [3,]
```
