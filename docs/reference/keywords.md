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

## CHANGED TO {#changed-to-changed-from}

```
Key CHANGED TO Value
```

Fires `true` for one evaluation tick when `Key` transitions **to** `Value`.

```
Phase CHANGED TO "combat"
Alert CHANGED TO True
```

::: warning Reactive layer pending
`CHANGED TO` and `CHANGED FROM` are fully parsed into the AST but evaluation returns `false` in the current release. A reactive blackboard adapter is required and is planned for a future phase.
:::

---

## CHANGED FROM

```
Key CHANGED FROM Value
```

Fires `true` for one evaluation tick when `Key` transitions **away from** `Value`.

```
Phase CHANGED FROM "idle"
IsAlive CHANGED FROM True
```

::: warning Reactive layer pending
Same as `CHANGED TO` — parsed correctly, evaluation pending the reactive adapter.
:::

---

## True / False

```
IsAlive = True
IsDefeated = False
```

Boolean literals. Case-insensitive — `true`, `True`, and `TRUE` are all accepted.
