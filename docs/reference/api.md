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

### Methods

```csharp
bool Evaluate(IEvalContext ctx)
```
Synchronous evaluation against the provided context. Returns `true` for empty queries.

```csharp
IReadOnlyList<string> GetReferencedKeys()
```
All blackboard key names referenced as identifiers in the query. Used by RealTime observers to determine which keys to subscribe to.

```csharp
IReadOnlyList<string> GetFunctionDependencyKeys(IEvalContext ctx)
```
Blackboard keys that functions in this query declare as hidden dependencies (via `IQueryFunction.GetDependencies`). Combined with `GetReferencedKeys()`, gives the full subscription set for a RealTime observer.

---

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
| `GetFunctionDependencies(string name, object[] args)` | Blackboard keys a function reads internally. Return empty if none. Default implementation returns empty. |

---

## SimpleEvalContext

```csharp
namespace ReefQL.Runtime

public class SimpleEvalContext : IEvalContext
```

In-memory context for tests and prototypes. No history or collection support beyond what you set explicitly.

```csharp
var ctx = new SimpleEvalContext();
ctx.Set("EmissionA", 5);
ctx.Set("IsAlive", true);

bool result = session.Evaluate(ctx);
```

| Method | Description |
|--------|-------------|
| `Set(string key, object value)` | Set a scalar value |
| `SetHistory(string key, IEnumerable<object> values)` | Set the history list for WAS queries |
| `SetCollection(string key, IEnumerable<object> values)` | Set the collection for CONTAINS queries |

---

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

---

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

---

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

---

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

---

## QueryEvaluateMode

```csharp
namespace Reefs.Query

public enum QueryEvaluateMode
```

| Value | Description |
|-------|-------------|
| `RealTime` | Observer subscribes to referenced keys. Re-evaluates automatically on any change. |
| `Trigger` | No subscriptions. Call `Evaluate()` manually. |

---

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

---

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
