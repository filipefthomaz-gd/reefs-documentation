# Query Syntax Reference

A Reefs query is a plain-text boolean expression. Queries are case-insensitive for keywords and key names, but string literals are case-sensitive.

---

## Comparisons

```
Left Operator Right
```

```
EmissionA > 2
Health <= 100
Phase = "combat"
Stage != "intro"
EmissionA >= OtherKey
```

Either side can be a key name, a literal, a function call, or an arithmetic expression.

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

```
A && B        // both must be true
A || B        // either must be true
!(A)          // negation
(A && B) || C // grouped
```

Parentheses control precedence. `&&` binds tighter than `||` without them.

---

## Existence

```
IsAlive        // true if IsAlive is truthy (non-null, non-zero, non-false, non-empty)
HasKey
```

A bare key name with no operator is an existence/truthy check.

---

## Literals

| Type | Examples |
|------|---------|
| Boolean | `True`, `False` |
| Integer | `42`, `-5`, `0` |
| Float | `1.5`, `0.75` |
| String | `"idle"`, `"combat"` |

---

## Arithmetic

```
A + B > 10
Score * 2 >= Threshold
Health - Damage <= 0
(A + B) * C > 20
```

The four operators `+`, `-`, `*`, `/` are supported. `*` and `/` bind tighter than `+` and `-`. Parentheses can be used inside an arithmetic context. Division by zero returns `null` (the comparison evaluates to `false`).

---

## WAS

```
Key WAS Operator Value
```

```
EmissionA WAS > 10
Phase WAS = "boss"
```

Latches `true` once the condition has been satisfied in the key's history. Stays true for the lifetime of the session. See [WAS](/reference/keywords#was).

---

## CHANGED

```
Key CHANGED
```

```
EmissionA CHANGED
Phase CHANGED
```

Fires `true` for one evaluation tick when the value changes to anything different. Requires at least two history entries. See [CHANGED](/reference/keywords#changed).

---

## CHANGED TO / CHANGED FROM

```
Key CHANGED TO Value
Key CHANGED FROM Value
```

```
Phase CHANGED TO "combat"
Phase CHANGED FROM "idle"
```

Ephemeral — fires `true` for one evaluation tick during a value transition. Reads the last two history entries. See [CHANGED TO / CHANGED FROM](/reference/keywords#changed-to-changed-from).

---

## INCREASED / DECREASED

```
Key INCREASED
Key DECREASED
Key INCREASED BY Delta
Key DECREASED BY Delta
```

```
Score INCREASED
Health DECREASED
Score INCREASED BY 5
```

Fires `true` for one tick when the numeric value moves in the specified direction. The `BY` form requires an exact delta match. See [INCREASED / DECREASED](/reference/keywords#increased-decreased).

---

## CONTAINS

```
Key CONTAINS Value
Key CONTAINS {Value, Value, ...}
```

```
ActiveEffects CONTAINS "Burn"
ActiveEffects CONTAINS {"Burn", "Freeze"}
```

Tests whether a list-type blackboard key holds the given value(s). Multi-value form requires all values to be present. See [CONTAINS](/reference/keywords#contains).

---

## IN / NOT IN

```
Operand IN {Value, Value, ...}
Operand NOT IN {Value, Value, ...}
Operand IN [Lo, Hi]
Operand IN (Lo, Hi)
Operand IN [Lo, Hi)
Operand IN (Lo, Hi]
```

```
Phase IN {"combat", "chase"}
State NOT IN {"idle", "dead"}
Health IN [50, 100]
Distance IN (0, 10)
```

Set membership or numeric interval test. `[`/`]` are inclusive bounds, `(`/`)` are exclusive. Bounds can be key names or arithmetic expressions. See [IN / NOT IN](/reference/keywords#in).

---

## COUNT

```
COUNT(condition) Operator Value
```

```
COUNT(EmissionA > 2) >= 3
COUNT(Phase = "combat") > 0
```

Counts rising-edge (false → true) activations of the inner condition. The counter accumulates for the lifetime of the session. See [COUNT](/reference/keywords#count).

---

## Functions

```
FunctionName(Arg)
FunctionName(Arg1, Arg2)
```

```
ThreatScore(CurrentTarget) > 5
IsInRange(TargetId) = True
```

Used as an operand anywhere a key name could appear. Arguments can be literals or key names.

---

## Full grammar (informal)

```
Query     = Expr
Expr      = LogicExpr | Term
LogicExpr = Term ('&&' | '||') Expr
Term      = '!' Term
           | '(' Expr ')'
           | WasExpr
           | ChangedExpr
           | ChangedToExpr
           | ChangedFromExpr
           | IncreasedExpr
           | DecreasedExpr
           | ContainsExpr
           | InExpr
           | CompareExpr
           | ExistenceExpr
           | OperandExpr

CompareExpr     = Operand Op Operand
WasExpr         = Operand 'WAS' Op Operand
ChangedExpr     = Identifier 'CHANGED'
ChangedToExpr   = Identifier 'CHANGED TO' Operand
ChangedFromExpr = Identifier 'CHANGED FROM' Operand
IncreasedExpr   = Identifier 'INCREASED' ['BY' Operand]
DecreasedExpr   = Identifier 'DECREASED' ['BY' Operand]
ContainsExpr    = Identifier 'CONTAINS' (Operand | '{' Operand {',' Operand} '}')
InExpr          = Operand ['NOT'] 'IN' ( '{' [Operand {',' Operand}] '}'
                                       | ('[' | '(') Operand ',' Operand (']' | ')') )
ExistenceExpr   = Identifier
OperandExpr     = FunctionCall | Literal

Operand      = ArithExpr
ArithExpr    = MulExpr { ('+' | '-') MulExpr }
MulExpr      = Atom    { ('*' | '/') Atom }
Atom         = '(' ArithExpr ')'
             | CountExpr
             | FunctionCall
             | Identifier
             | Literal
CountExpr    = 'COUNT' '(' Expr ')'
FunctionCall = Identifier '(' [Operand {',' Operand}] ')'
Literal      = Number | String | Boolean
Op           = '=' | '==' | '!=' | '>' | '<' | '>=' | '<='
```
