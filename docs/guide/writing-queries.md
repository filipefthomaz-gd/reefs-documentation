# Writing Queries

A query is a plain-text boolean expression evaluated against a blackboard. It can be as simple as a single comparison or a deeply nested logical expression.

## Comparisons

The most common form: `Left Operator Right`.

```
EmissionA > 2
Health <= 100
Phase = "combat"
Stage != "intro"
EmissionA >= OtherKey
```

Either side can be a blackboard key, a literal value, a function call, or an arithmetic expression. Both sides can be keys — `A != B` compares the current values of two keys.

| Operator | Meaning |
|----------|---------|
| `=`  | Equal |
| `!=` | Not equal |
| `>`  | Greater than |
| `<`  | Less than |
| `>=` | Greater than or equal |
| `<=` | Less than or equal |

---

## Logic

Combine expressions with `&&` (and), `||` (or), or negate with `!`:

```
EmissionA > 2 && IsAlive = True
Phase = "combat" || Phase = "chase"
!(IsAlive = True)
(Health > 0 && Stamina > 0) || IsUndead = True
```

::: tip Parentheses
Use parentheses to make precedence explicit. `&&` binds tighter than `||` without them, but explicit grouping is clearer.
:::

---

## Existence check

A bare key name (no operator) evaluates `true` if the value is truthy — non-null, non-zero, non-empty, non-false:

```
IsAlive
HasKey
```

---

## Literals

| Form | Examples |
|------|---------|
| Boolean | `True`, `False` |
| Integer | `0`, `42`, `-5` |
| Float | `1.5`, `0.75` |
| String | `"combat"`, `"idle"` |

String literals are case-sensitive.

---

## Arithmetic

Arithmetic operators can appear anywhere an operand is expected — inside comparisons, IN bounds, function arguments, and more:

```
Health - Damage > 0
Score * Multiplier >= Threshold
(A + B) * C > 20
Score IN [Base * 2, Base * 4]
```

Operator precedence: `*` and `/` bind tighter than `+` and `-`. Parentheses can be used within an arithmetic context. Division by zero returns `null` (the surrounding comparison evaluates to `false`).

---

## WAS — temporal latch

`WAS` checks the full history of a key. Once the condition has ever been satisfied, it latches `true` and stays true for the lifetime of the observer:

```
EmissionA WAS > 10
Phase WAS = "boss"
```

::: info Latch behaviour
`WAS` reads from the blackboard's history snapshots. It never resets within a session — use a separate flag on the blackboard if you need a resettable condition.
:::

---

## CHANGED — any-value transition

`CHANGED` fires `true` for one evaluation tick when a key's value is different from its previous recorded value:

```
EmissionA CHANGED
Phase CHANGED
```

Requires at least two history entries. Returns `false` on the first evaluation when no prior value exists.

---

## CHANGED TO / CHANGED FROM — targeted transitions

These expressions detect a specific value transition and fire `true` for one evaluation tick:

```
Phase CHANGED TO "combat"
Phase CHANGED FROM "idle"
Alert CHANGED TO True
```

Both require at least two history entries (current and previous value). `CHANGED TO` checks that the current value matches the target and the previous did not. `CHANGED FROM` checks the inverse.

---

## INCREASED / DECREASED — directional change

Fires `true` for one tick when a numeric key's value moves in the specified direction since its last recorded value:

```
Score INCREASED
Health DECREASED
```

The `BY` form additionally requires the absolute delta to match exactly:

```
Score INCREASED BY 5
Health DECREASED BY 25
```

Both forms require at least two numeric history entries. Equal values return `false` — the direction must be strictly positive or negative.

---

## IN / NOT IN — set membership and intervals

Test whether a value belongs to a discrete set:

```
Phase IN {"combat", "chase", "alert"}
State NOT IN {"idle", "dead"}
Phase IN {1, 2, 3}
```

Test whether a numeric value falls within a range. `[` and `]` are inclusive bounds; `(` and `)` are exclusive:

```
Health IN [50, 100]      // 50 ≤ Health ≤ 100
Distance IN (0, 10)      // 0 < Distance < 10
X IN [0, 5)              // 0 ≤ X < 5
Health NOT IN [0, 25]    // outside the critical range
```

Interval bounds can be key names or arithmetic expressions:

```
A IN [MinVal, MaxVal]
Score IN [Base * 2, Base * 4]
```

---

## CONTAINS — collection check

`CONTAINS` tests whether a list-type blackboard key holds a value:

```
ActiveEffects CONTAINS "Burn"
```

Multi-value form — all listed values must be present:

```
ActiveEffects CONTAINS {"Burn", "Freeze"}
```

---

## COUNT — rising-edge counter

`COUNT` counts how many times an inner condition has transitioned from `false` to `true` across evaluations. It returns an integer that can be compared like any other value:

```
COUNT(EmissionA > 2) >= 3
COUNT(Phase = "combat") > 0
```

The counter increments only on a **rising edge** — when the condition flips from `false` to `true`. Consecutive ticks where the condition stays `true` do not add to the count.

::: info Lifetime persistence
The count never resets for the lifetime of the `QuerySession`. If you need a resettable counter, write an explicit counter to the blackboard and query that instead.
:::

The inner expression can be any valid query, including compound expressions:

```
COUNT(Health < 20 && IsAlive = True) >= 2
```

---

## Windowed expressions — time constraints

Wrap any condition in `{...}|[Lo, Hi]` to add a time constraint. Requires the context to implement `IWindowedEvalContext` and a valid time source.

### Duration mode

The inner condition must be *continuously* true for a duration within `[Lo, Hi]`:

```
{Health < 20}|[3,]        // in critical health for at least 3 time units
{A > 5}|[3, 10]           // A > 5 for between 3 and 10 time units
{IsStunned = True}|[,5]   // stunned for at most 5 time units
```

Bounds use the same inclusive/exclusive syntax as `IN`:

```
{A > 5}|[3, 10)   // 3 ≤ duration < 10
```

### Window mode — LAST and NOW

Check whether the condition was true at *any point* within a sliding time window:

```
{Phase = "combat"}|LAST 4h              // in combat at any point in the last 4 hours
{A > 5}|[NOW - 30, NOW]                 // was true in the last 30 time units
{Health < 20}|[NOW - 1h, NOW - 10m]     // was critical between 10 min and 1 h ago
```

`LAST 4h` is shorthand for `[NOW - 4h, NOW]` inclusive.

### Duration literals

Unit suffixes are resolved by the context. The default mapping in `SimpleEvalContext` is:

| Suffix | Default value |
|--------|--------------|
| `ms` | 0.001 s |
| `s` | 1 s |
| `m` | 60 s |
| `h` | 3 600 s |
| `d` | 86 400 s |

Multiple units chain without spaces: `1d2h30m`.

For game time or tick-based time, provide a custom `SetDurationResolver()` on your context.

### Performance

Windowed expressions do **not** re-evaluate on every time tick. After each `Evaluate()` call, `QuerySession.NextScheduledEvaluationTime` tells the reactive layer when to re-evaluate next:

```csharp
// On blackboard key change — always re-evaluate
void OnKeyChanged(string key) => session.Evaluate(ctx);

// On time tick — only re-evaluate when a boundary is crossed
void OnTick(double currentTime) {
    if (session.NextScheduledEvaluationTime is double t && currentTime >= t)
        session.Evaluate(ctx);
}
```

::: tip State model
A windowed interval opens the moment `Evaluate()` is called with the inner condition true. For accurate durations, call `Evaluate()` immediately after setting relevant blackboard keys — not just on time ticks.
:::

---

## Functions

A custom function can appear as an operand anywhere a key name could:

```
ThreatScore(EnemyId) > 5
IsInRange(TargetId) = True
```

Functions are resolved at evaluation time via `IEvalContext.ResolveFunction`. See [Unity Integration](/guide/unity-integration#custom-functions) for how to register them.

---

## Full examples

```
// Enemy is alive and hostile
IsAlive = True && Faction = "hostile"

// Player was ever in critical health
Health WAS < 20

// Inventory contains both key items
Inventory CONTAINS {"RustedKey", "MedKit"}

// Complex: alive, or already defeated, or a ghost phase
(IsAlive = True && Phase != "dead") || Phase WAS = "dead" || IsGhost = True

// Threat level from a custom function
ThreatScore(CurrentTarget) >= 8 && ActiveEffects CONTAINS "Enraged"

// Phase is one of several active states
Phase IN {"combat", "chase", "alert"}

// Health is in the safe range
Health IN [50, 100]

// Score jumped by exactly 10 points
Score INCREASED BY 10

// Boss phase triggered at least 3 times
COUNT(Phase = "combat") >= 3

// Player has gone critical more than once and is still alive
COUNT(Health < 20) > 1 && IsAlive = True

// Effective damage after reduction, using arithmetic
(BaseDamage - Armor) * 2 > HealthThreshold

// Stunned for at least 3 seconds
{IsStunned = True}|[3,]

// Was in combat at any point in the last 10 minutes
{Phase = "combat"}|LAST 10m

// In critical health for exactly 2–5 seconds (alarm window)
{Health < 20}|[2, 5]

// Boss fight lasted between 30s and 2 minutes
{Phase = "boss"}|[30s, 2m]
```
