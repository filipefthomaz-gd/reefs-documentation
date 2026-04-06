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

Either side can be a blackboard key, a literal value, or a function call. Both sides can be keys — `A != B` compares the current values of two keys.

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

## CHANGED TO / CHANGED FROM — ephemeral transitions

These expressions detect a value transition. They fire `true` for one evaluation tick when the transition occurs:

```
Phase CHANGED TO "combat"
Phase CHANGED FROM "idle"
```

::: warning Reactive layer required
`CHANGED TO` and `CHANGED FROM` require RealTime mode and a reactive blackboard. The AST is parsed correctly but evaluation returns `false` in the current release — the reactive adapter is pending.
:::

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
```
