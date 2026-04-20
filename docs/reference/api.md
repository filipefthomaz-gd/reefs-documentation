# API Reference

## QuerySession

The main entry point for the Unity-free core. Parse once, evaluate many times.

```csharp
namespace ReefQL.Runtime

public class QuerySession
```

### Constructor

```csharp
new QuerySession(string query)
```

Parses the query string and stores the AST. Throws `ArgumentNullException` if `query` is null. An empty or whitespace query is valid and always evaluates to `true`.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `Query` | `string` | The original query string |
| `Ast` | `QueryExpr?` | The parsed AST. Null when query is empty. |
| `NextScheduledEvaluationTime` | `double?` | Next time at which a windowed result may change. Null if no windowed expressions. |

### Methods

```csharp
bool Evaluate(IEvalContext ctx)
```
Synchronous evaluation against the provided context. Returns `true` for empty queries. After each call, `NextScheduledEvaluationTime` is updated.

```csharp
IReadOnlyList<string> GetReferencedKeys()
```
All blackboard key names referenced as identifiers in the query. Used by RealTime observers to determine which keys to subscribe to.

```csharp
IReadOnlyList<string> GetFunctionDependencyKeys(IEvalContext ctx)
```
Blackboard keys that functions in this query declare as hidden dependencies (via `IQueryFunction.GetDependencies`). Combined with `GetReferencedKeys()`, gives the full subscription set for a RealTime observer.

## IncrementalEvaluator

```csharp
namespace Reefs.QL.Evaluation

public class IncrementalEvaluator
```

Dependency-aware, cached evaluator. Only sub-trees that depend on a changed blackboard key are re-evaluated; unaffected sub-trees return their cached result immediately. Suited for reactive pipelines where blackboard keys change one at a time.

See [Incremental Evaluation](/guide/incremental-evaluation) for a full usage guide.

### Constructor

```csharp
new IncrementalEvaluator(QueryExpr root)
```

Builds the dependency map for the entire AST. Pass `null` for an empty query — `Seed` and `Evaluate` both return `true` in that case.

### Methods

```csharp
bool Seed(IEvalContext ctx)
```
Full evaluation. Walks every node and populates the result cache. **Call once after construction**, before any incremental updates begin.

```csharp
bool Evaluate(string changedKey, IEvalContext ctx)
```
Incremental evaluation. Only nodes whose dependency set contains `changedKey` are re-evaluated; all other nodes return their cached result.

```csharp
bool EvaluateTime(IEvalContext ctx)
```
Time-triggered evaluation. Only windowed sub-trees are re-evaluated. Call when the clock reaches `NextScheduledTime`.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `NextScheduledTime` | `double?` | Next time at which a windowed node may change state. Null if no windowed expressions. |

### COUNT and windowed state

`IncrementalEvaluator` maintains its own persistent `COUNT` and windowed interval state internally. Both accumulate across all calls for the lifetime of the instance.

### Example

```csharp
var session = new QuerySession("EmissionA > 2 && COUNT(Phase = \"boss\") >= 3");
var evaluator = new IncrementalEvaluator(session.Ast);

// Seed the cache once
bool initial = evaluator.Seed(ctx);

// Later, only EmissionA changed — only the EmissionA sub-tree is re-evaluated
bool updated = evaluator.Evaluate("EmissionA", ctx);
```

## IEvalContext

```csharp
namespace ReefQL.Evaluation

public interface IEvalContext
```

Implement this to connect any blackboard to the evaluator. The Unity implementation is `BlackboardEvalContext`.

| Method | Description |
|--------|-------------|
| `GetValue(string key)` | Current scalar value for a key. Return `null` if absent. |
| `GetHistory(string key)` | Full ordered history (oldest first). Used by `WAS`. |
| `GetCollection(string key)` | Current list values for a key. Used by `CONTAINS`. |
| `ResolveFunction(string name, object[] args)` | Resolve a custom function call. Returns a boxed `bool` or comparable value. |
| `GetFunctionDependencies(string name, object[] args)` | Blackboard keys a function reads internally. Default returns empty. |
| `GetCurrentTime()` | Current time as opaque `double?`. Default returns `null`. Required for windowed expressions. |

## IWindowedEvalContext

```csharp
namespace Reefs.QL.Evaluation

public interface IWindowedEvalContext : IEvalContext
```

Extends `IEvalContext` for contexts that support windowed expressions. `SimpleEvalContext` implements this by default.

| Method | Description |
|--------|-------------|
| `GetTimestampedHistory(string key)` | History entries with timestamps, oldest first. |
| `ResolveDuration(double value, string unit)` | Converts a duration literal to time units. E.g. `"h"` → `3600.0` in real-time. |

## SimpleEvalContext

```csharp
namespace Reefs.QL.Runtime

public class SimpleEvalContext : IWindowedEvalContext
```

In-memory context for tests and prototypes. Implements `IWindowedEvalContext` — windowed queries work out of the box.

```csharp
var ctx = new SimpleEvalContext();
ctx.Set("A", 10);
ctx.SetTime(0.0);

var session = new QuerySession("A > 5 @ [3,]");
session.Evaluate(ctx); // opens interval at t=0

ctx.SetTime(5.0);
bool result = session.Evaluate(ctx); // true — A > 5 for 5 time units
```

| Method | Description |
|--------|-------------|
| `Set(string key, object value)` | Set a scalar value and append to timestamped history |
| `SetTime(double time)` | Advance the current time |
| `AddToCollection(string key, object item)` | Add an item to a collection key |
| `RemoveFromCollection(string key, object item)` | Remove an item from a collection key |
| `SetFunctionResolver(Func<string, object[], object>)` | Register a custom function handler |
| `SetDurationResolver(Func<double, string, double>)` | Override the default `s/m/h/d/ms` duration unit mapping |

## IQueryObserver

```csharp
namespace Reefs.Query   (Unity layer)

public interface IQueryObserver
```

Returned by `QueryStore.Get`. Do not construct directly.

| Member | Description |
|--------|-------------|
| `Query` | The query string |
| `EvaluateMode` | `RealTime` or `Trigger` |
| `State` | Current evaluated result |
| `OnStateChanged` | `Action<bool>` — fires only when the result flips |
| `ReferencedKeys` | Blackboard keys the query reads |
| `Evaluate()` | Force a re-evaluation. Returns the new state. |
| `Dispose()` | Cancel all RealTime subscriptions. No-op for Trigger observers. |

## QueryStore

```csharp
namespace Reefs

public class QueryStore
```

Cache of `IQueryObserver` instances keyed by `(query, mode)`. Managed by `ReefQLProvider`.

```csharp
IQueryObserver Get(IQueryData queryData)
IQueryObserver Get(IQuery query)
void Clear()
```

`Get` creates and initialises the observer on first access; subsequent calls with the same key return the cached instance. `Clear` disposes all observers and emits `OnClear`.

## ReefQLProvider

```csharp
namespace ReefQL   (Unity layer)

public static class ReefQLProvider
```

Static accessor. Resets on every `AfterSceneLoad`.

```csharp
BlackboardEvalContext Get()     // The shared IEvalContext
QueryStore GetStore()           // The shared observer cache
```

## IQueryData

```csharp
namespace Reefs.Query

public interface IQueryData
```

Minimal interface for a query asset.

```csharp
string Query { get; }
QueryEvaluateMode EvaluateMode { get; }
```

## QueryEvaluateMode

```csharp
namespace Reefs.Query

public enum QueryEvaluateMode
```

| Value | Description |
|-------|-------------|
| `RealTime` | Observer subscribes to referenced keys. Re-evaluates automatically on any change. |
| `Trigger` | No subscriptions. Call `Evaluate()` manually. |

## IQueryFunction

```csharp
namespace ReefQL   (Unity layer)

public interface IQueryFunction
```

Implement to add a custom function operand. Discovered automatically via reflection at runtime.

```csharp
string Name { get; }
object Evaluate(object[] args);
IEnumerable<string> GetDependencies(object[] args);
```

| Member | Description |
|--------|-------------|
| `Name` | The function name as used in queries, e.g. `"ThreatScore"` |
| `Evaluate(args)` | Compute and return the function's value |
| `GetDependencies(args)` | Blackboard keys this function reads internally — used for RealTime subscription coverage |

## BlackboardEvalContext

```csharp
namespace ReefQL   (Unity layer)

public class BlackboardEvalContext : IEvalContext
```

The Unity-side implementation of `IEvalContext`. Bridges `IBlackboard` and `IQueryFunction` implementations into the evaluator. Obtained via `ReefQLProvider.Get()`, not constructed directly.

```csharp
IDisposable SubscribeToKey(string key, Action onChange)
```

Subscribes to writes on `key` via `IBlackboard.OnAnyWrite`. Used internally by `QueryObserver.Init()` for RealTime mode. Returns a disposable that cancels the subscription.
