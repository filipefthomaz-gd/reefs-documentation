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

Either side can be a key name, a literal, or a function call.

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

## CHANGED TO / CHANGED FROM

```
Key CHANGED TO Value
Key CHANGED FROM Value
```

```
Phase CHANGED TO "combat"
Phase CHANGED FROM "idle"
```

Ephemeral — fires `true` for one evaluation tick during a value transition. Requires RealTime mode. See [CHANGED TO / CHANGED FROM](/reference/keywords#changed-to-changed-from).

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
Term      = '!' '(' Expr ')'
           | '(' Expr ')'
           | WasExpr
           | ChangedExpr
           | ContainsExpr
           | CompareExpr
           | ExistenceExpr
           | OperandExpr

CompareExpr  = Operand Op Operand
WasExpr      = Operand 'WAS' Op Operand
ChangedExpr  = Identifier ('CHANGED TO' | 'CHANGED FROM') Operand
ContainsExpr = Identifier 'CONTAINS' (Operand | '{' Operand {',' Operand} '}')
ExistenceExpr = Identifier
OperandExpr  = FunctionCall | Literal

Operand      = Identifier | Literal | FunctionCall
FunctionCall = Identifier '(' [Operand {',' Operand}] ')'
Literal      = Number | String | Boolean
Op           = '=' | '!=' | '>' | '<' | '>=' | '<='
```
