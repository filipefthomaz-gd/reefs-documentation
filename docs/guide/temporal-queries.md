# Temporal Queries

Temporal expressions let queries reason about history — what a key's value used to be, how it changed, and how many times a condition has fired. These expressions complement basic comparisons and work on the history data stored in the blackboard.

## WAS — history latch

`WAS` checks the full history of a key. Once the condition has ever been satisfied, it latches `true` and stays true for the lifetime of the observer:

```
EmissionA WAS > 10
Phase WAS = "boss"
Health WAS < 20
```

::: info Latch behaviour
`WAS` reads from the blackboard's history snapshots. It never resets within a session — use a separate flag on the blackboard if you need a resettable condition.
:::

**Works with:** `=`, `!=`, `>`, `<`, `>=`, `<=`.

## CHANGED — any-value transition

`CHANGED` fires `true` for one evaluation tick when a key's value is different from its previous recorded value:

```
EmissionA CHANGED
Phase CHANGED
```

Requires at least two history entries. Returns `false` on the first evaluation when no prior value exists.

## CHANGED TO / CHANGED FROM — targeted transitions

These expressions detect a specific value transition and fire `true` for one evaluation tick:

```
Phase CHANGED TO "combat"
Phase CHANGED FROM "idle"
Alert CHANGED TO True
IsAlive CHANGED FROM True
```

Both require at least two history entries (current and previous value). `CHANGED TO` checks that the current value matches the target and the previous did not. `CHANGED FROM` checks the inverse.

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

## Full examples

```
// Player was ever in critical health
Health WAS < 20

// Boss phase was ever reached
Phase WAS = "boss"

// Phase just entered combat
Phase CHANGED TO "combat"

// Phase just left idle
Phase CHANGED FROM "idle"

// Alert state changed to anything
Alert CHANGED

// Score just went up
Score INCREASED

// Score jumped by exactly 10 points
Score INCREASED BY 10

// Health dropped by exactly 25 points
Health DECREASED BY 25

// Boss phase triggered at least 3 times
COUNT(Phase = "combat") >= 3

// Player has gone critical more than once and is still alive
COUNT(Health < 20) > 1 && IsAlive = True

// Compound condition counted
COUNT(Health < 20 && IsAlive = True) >= 2
```
