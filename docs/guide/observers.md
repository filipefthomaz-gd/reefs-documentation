# Observers & Evaluation Modes

A `QueryObserver` wraps a `QuerySession` with state tracking and optional reactive subscriptions. You never construct one directly — obtain it through `QueryStore`.

## Evaluation modes

Every observer has one of two modes, set at creation time via `IQueryData.EvaluateMode`:

| Mode | Behaviour |
|------|-----------|
| `RealTime` | Subscribes to every blackboard key the query references. Re-evaluates automatically whenever any of them changes. `OnStateChanged` fires only when the result flips. |
| `Trigger` | No subscriptions. Evaluates only when you call `Evaluate()` manually — useful for AI decisions, timeline events, or one-shot checks. |

## Getting an observer

Observers are cached inside `QueryStore` keyed by `(query string, mode)`. Requesting the same query twice returns the same observer:

```csharp
// In Unity — via ReefQLProvider
var observer = ReefQLProvider.GetStore().Get(myQueryData);

// myQueryData implements IQueryData:
//   string Query         => "Health > 0 && IsAlive = True"
//   QueryEvaluateMode    => QueryEvaluateMode.RealTime
```

::: tip ScriptableObject as IQueryData
A common pattern is to implement `IQueryData` on a `ScriptableObject`. Designers fill in the query string and evaluation mode in the Inspector; code just passes the asset to `QueryStore.Get`.
:::

## Reacting to state changes

```csharp
var observer = ReefQLProvider.GetStore().Get(myQueryData);

observer.OnStateChanged += isTrue =>
{
    if (isTrue) OnQueryBecameTrue();
    else        OnQueryBecameFalse();
};
```

`OnStateChanged` is an `Action<bool>`. It fires **only when the result changes** — not on every evaluation. The current result is also available at any time via `observer.State`.

## Manual evaluation (Trigger mode)

```csharp
// Set up with Trigger mode
var observer = ReefQLProvider.GetStore().Get(myTriggerQueryData);

// Evaluate on demand
bool result = observer.Evaluate();
```

Call `Evaluate()` from an AI behaviour, a timeline signal, an animation event, or wherever you need a one-shot check.

## Inspecting referenced keys

```csharp
IReadOnlyList<string> keys = observer.ReferencedKeys;
// → ["Health", "IsAlive"]
```

Useful for debugging which blackboard keys drive a query, or for building editor tooling.

## Disposing observers

`QueryStore` manages observer lifetime for you. When the store is cleared (on scene load), all subscriptions are disposed automatically.

If you need to release an observer manually before that — for example, when a component is destroyed mid-scene — dispose it explicitly:

```csharp
void OnDestroy()
{
    _observer.Dispose();
}
```

Calling `Dispose` on a `Trigger`-mode observer is a no-op (there are no subscriptions to cancel).

## IQueryObserver interface

The interface exposed by `QueryStore.Get`:

```csharp
public interface IQueryObserver
{
    string Query { get; }
    QueryEvaluateMode EvaluateMode { get; }
    bool State { get; }
    Action<bool> OnStateChanged { get; set; }
    IReadOnlyList<string> ReferencedKeys { get; }

    bool Evaluate();
    void Dispose();
}
```
