# Keywords

## WAS {#was}

```
Key WAS Operator Value
```

Checks the full history of a blackboard key. Returns `true` if the condition was ever satisfied at any recorded point in time. Once true, it latches and never reverts for the lifetime of the observer session.

```
EmissionA WAS > 10
Phase WAS = "boss"
Health WAS < 20
```

**History source:** `IEvalContext.GetHistory(key)` — provided by `BlackboardEvalContext` from `IBlackboard.Entries[key].SnapshotHistory`.

**Latch behaviour:** `WAS` does not reset. If you need a resettable condition, write an explicit flag to the blackboard and query that instead.

**Works with:** `=`, `!=`, `>`, `<`, `>=`, `<=`.

---

## CONTAINS {#contains}

```
Key CONTAINS Value
Key CONTAINS {Value1, Value2, ...}
```

Tests whether a list-type blackboard key contains the specified value. The multi-value form requires **all** listed values to be present.

```
ActiveEffects CONTAINS "Burn"
ActiveEffects CONTAINS {"Burn", "Freeze", "Slow"}
Inventory CONTAINS "RustedKey"
```

**Collection source:** `IEvalContext.GetCollection(key)` — provided by `BlackboardEvalContext` from `IBlackboard.ReadList<object>(key)`.

Values in the set can be literals or key names (resolved to their current blackboard value at evaluation time).

---

## IN / NOT IN {#in}

```
Operand IN {Value1, Value2, ...}
Operand NOT IN {Value1, Value2, ...}
```

Set membership test. Returns `true` if the operand equals any value in the set.

```
Phase IN {"combat", "chase", "alert"}
State NOT IN {"idle", "dead"}
```

**Interval form:** Tests whether a numeric value falls within a range. Brackets control inclusivity: `[` and `]` are inclusive, `(` and `)` are exclusive. Mixed half-open intervals are supported.

```
Health IN [50, 100]      // 50 ≤ Health ≤ 100
Distance IN (0, 10)      // 0 < Distance < 10
X IN [0, 5)              // 0 ≤ X < 5
X IN (0, 5]              // 0 < X ≤ 5
Health NOT IN [0, 25]    // Health outside critical range
```

Interval bounds can be key names or arithmetic expressions:

```
A IN [MinVal, MaxVal]
Score IN [Base * 2, Base * 4]
```

---

## CHANGED {#changed}

```
Key CHANGED
```

Fires `true` for one evaluation tick when the value of `Key` changes to anything different from its previous recorded value. Requires at least two history entries.

```
EmissionA CHANGED
Phase CHANGED
```

**History source:** Reads the last two values from `IEvalContext.GetHistory(key)`. Returns `false` if fewer than two history entries exist.

---

## CHANGED TO {#changed-to-changed-from}

```
Key CHANGED TO Value
```

Fires `true` for one evaluation tick when `Key` transitions **to** `Value` from any other value. Requires at least two history entries.

```
Phase CHANGED TO "combat"
Alert CHANGED TO True
```

**History source:** Reads the last two values from `IEvalContext.GetHistory(key)`. Returns `false` if the key has no prior value.

---

## CHANGED FROM

```
Key CHANGED FROM Value
```

Fires `true` for one evaluation tick when `Key` transitions **away from** `Value` to any other value. Requires at least two history entries.

```
Phase CHANGED FROM "idle"
IsAlive CHANGED FROM True
```

---

## INCREASED / DECREASED {#increased-decreased}

```
Key INCREASED
Key DECREASED
Key INCREASED BY Delta
Key DECREASED BY Delta
```

Fires `true` for one evaluation tick when the numeric value of `Key` moves in the specified direction compared to its previous value. The `BY` form additionally checks that the absolute delta equals the given value.

```
Score INCREASED
Health DECREASED
Score INCREASED BY 5
Health DECREASED BY 25
```

**History source:** Reads the last two values from `IEvalContext.GetHistory(key)`. Returns `false` if the key has fewer than two history entries or if either value is non-numeric.

**Note:** `INCREASED` and `DECREASED` are strictly directional — equal values return `false`.

---

## COUNT {#count}

```
COUNT(condition) Operator Value
```

Counts the number of times the inner condition has made a **rising-edge transition** (false → true) across evaluations. Returns an integer that can be used in a comparison expression.

```
COUNT(EmissionA > 2) >= 3
COUNT(Phase = "combat") > 0
COUNT(Health < 20) >= 5 && IsAlive = True
```

**Rising-edge semantics:** The counter only increments when the inner condition transitions from `false` to `true`. Consecutive ticks where the condition remains `true` do not increment the counter.

**Persistence:** The count never resets for the lifetime of the `QuerySession`. If you need a resettable counter, write an explicit counter to the blackboard and query that instead.

**Nesting:** `COUNT` cannot be nested inside another `COUNT`.

**Return type:** Integer, comparable with `=`, `!=`, `>`, `<`, `>=`, `<=`.

---

## Windowed expressions {#windowed}

```
{Condition}|[Lo, Hi]
{Condition}|[Lo,]
{Condition}|[,Hi]
{Condition}|LAST Duration
```

Constrains a condition with a time boundary. Requires the context to implement `IWindowedEvalContext`.

Two modes, depending on whether bounds contain `NOW`:

**Duration mode** — how long the inner condition has been *continuously* true:

```
{A > 5}|[3, 10]       // A > 5 for between 3 and 10 time units
{A > 5}|[3,]          // A > 5 for at least 3 time units
{Health < 20}|[,5]    // Health < 20 for at most 5 time units
```

**Window mode** — whether the inner condition was true at *any point* within an absolute time range:

```
{A > 5}|LAST 4h                    // was true at any point in the last 4 hours
{Phase = "combat"}|[NOW - 10, NOW] // was true in the last 10 time units
```

`LAST Duration` is sugar for `[NOW - Duration, NOW]` (inclusive both ends).

**Duration literals** — unit suffixes are game-defined via `IWindowedEvalContext.ResolveDuration`. The default mapping in `SimpleEvalContext` is: `ms` = 0.001 s, `s` = 1 s, `m` = 60 s, `h` = 3 600 s, `d` = 86 400 s. Multiple units chain: `1d2h` = 1 day + 2 hours.

**Bracket rules** — same inclusive/exclusive syntax as `IN`:

```
{A > 5}|[3, 10]    // 3 ≤ duration ≤ 10
{A > 5}|(3, 10)    // 3 < duration < 10
{A > 5}|[3, 10)    // 3 ≤ duration < 10
```

**Scheduled re-evaluation** — after each `Evaluate()` call, `QuerySession.NextScheduledEvaluationTime` returns the next time at which a windowed result may change. The reactive layer should call `Evaluate()` again when the clock reaches that value, instead of re-evaluating on every tick.

**State model** — a windowed interval opens the moment `Evaluate()` is first called with the inner condition true. For accurate results, call `Evaluate()` whenever any relevant blackboard key changes.

---

## NOW {#now}

```
NOW
```

Resolves to `IEvalContext.GetCurrentTime()` at evaluation time. Used only inside windowed expression bounds:

```
{A > 5}|[NOW - 30, NOW]
```

---

## True / False

```
IsAlive = True
IsDefeated = False
```

Boolean literals. Case-insensitive — `true`, `True`, and `TRUE` are all accepted.
