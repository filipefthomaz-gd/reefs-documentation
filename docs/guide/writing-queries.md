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

## Existence check

A bare key name (no operator) evaluates `true` if the value is truthy — non-null, non-zero, non-empty, non-false:

```
IsAlive
HasKey
```

## Literals

| Form | Examples |
|------|---------|
| Boolean | `True`, `False` |
| Integer | `0`, `42`, `-5` |
| Float | `1.5`, `0.75` |
| String | `"combat"`, `"idle"` |

String literals are case-sensitive.

## Arithmetic

Arithmetic operators can appear anywhere an operand is expected — inside comparisons, IN bounds, function arguments, and more:

```
Health - Damage > 0
Score * Multiplier >= Threshold
(A + B) * C > 20
Score IN [Base * 2, Base * 4]
```

Operator precedence: `*` and `/` bind tighter than `+` and `-`. Parentheses can be used within an arithmetic context. Division by zero returns `null` (the surrounding comparison evaluates to `false`).

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

## CONTAINS — collection check

`CONTAINS` tests whether a list-type blackboard key holds a value:

```
ActiveEffects CONTAINS "Burn"
```

Multi-value form — all listed values must be present:

```
ActiveEffects CONTAINS {"Burn", "Freeze"}
```

## Functions

A custom function can appear as an operand anywhere a key name could:

```
ThreatScore(EnemyId) > 5
IsInRange(TargetId) = True
```

Functions are resolved at evaluation time via `IEvalContext.ResolveFunction`. See [Unity Integration](/guide/unity-integration#custom-functions) for how to register them.

## Full examples

```
// Enemy is alive and hostile
IsAlive = True && Faction = "hostile"

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

// Effective damage after reduction, using arithmetic
(BaseDamage - Armor) * 2 > HealthThreshold
```

For time-based and history queries, see [Temporal Queries](/guide/temporal-queries). For time-window constraints, see [Windowed Queries](/guide/windowed-queries).
