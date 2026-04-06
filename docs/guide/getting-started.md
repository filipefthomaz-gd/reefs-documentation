# Getting Started

## What is Reefs

Reefs is a reactive query language for the OCEAN blackboard system. You write plain-text boolean expressions — *queries* — and Reefs evaluates them against blackboard state. Observers can re-evaluate automatically whenever relevant keys change and fire a callback only when the result flips.

The core is a Unity-free .NET Standard 2.1 library. The Unity adapter lives in a separate layer.

## Your first query

```csharp
using ReefQL.Runtime;

var session = new QuerySession("EmissionA > 2 && IsAlive = True");

var ctx = new SimpleEvalContext();
ctx.Set("EmissionA", 5);
ctx.Set("IsAlive", true);

bool result = session.Evaluate(ctx); // → true
```

`QuerySession` parses the query once and caches the AST. Call `Evaluate` as many times as you need — parsing only happens in the constructor.

::: tip Parse once, evaluate often
Constructing a `QuerySession` is the expensive step. In Unity, create sessions at initialisation time (e.g. `Awake`) and store them, not inside `Update`.
:::

## Combining conditions

Reefs supports `&&`, `||`, and `!`:

```csharp
var session = new QuerySession("(Health > 0 && IsAlive = True) || IsGhost = True");
```

Parentheses are optional but recommended for clarity.

## Checking history

`WAS` latches `true` once a condition was ever satisfied in the key's history:

```csharp
var session = new QuerySession("EmissionA WAS > 10");
```

Once the blackboard records a value above 10 for `EmissionA`, this query returns `true` for the lifetime of the session — even if the current value drops.

## In Unity

In a Unity project, get a managed observer through `QueryStore` instead of constructing `QuerySession` directly:

```csharp
var observer = ReefQLProvider.GetStore().Get(myQueryData);
observer.OnStateChanged += isTrue => Debug.Log($"Query flipped: {isTrue}");
```

See [Unity Integration](/guide/unity-integration) for the full setup.

## Next steps

- [Writing Queries](/guide/writing-queries) — full language guide
- [Observers & Modes](/guide/observers) — RealTime vs Trigger, subscriptions, disposal
- [Unity Integration](/guide/unity-integration) — QueryStore, BlackboardEvalContext, IQueryFunction
- [Query Syntax](/reference/syntax) — complete syntax listing
