# Unity Integration

The Unity layer connects the Unity-free ReefQL core to the OCEAN blackboard. It lives in `Assets/Ocean/ReefQL/` and depends on `Reefs.Blackboard` and R3.

## Architecture

```
ReefQL (DLL)               Unity layer
───────────────────        ──────────────────────────────
IEvalContext          ←    BlackboardEvalContext
QuerySession               (reads IBlackboard, resolves IQueryFunction)
QueryStore                 ReefQLProvider  (static accessor)
IQueryObserver             QueryObserver   (wraps QuerySession + R3 subs)
```

The DLL knows nothing about Unity. `BlackboardEvalContext` is the only place that bridges the two sides.

## ReefQLProvider

Static accessor for the global context and store. Reset automatically on every scene load:

```csharp
// The shared IEvalContext backed by the global blackboard
BlackboardEvalContext ctx = ReefQLProvider.Get();

// The shared QueryStore — observers are cached here by (query, mode)
QueryStore store = ReefQLProvider.GetStore();
```

::: warning Lifecycle
`ReefQLProvider` initialises `AfterSceneLoad`, after `BlackboardProvider` which initialises `BeforeSceneLoad`. Never cache the result of `Get()` or `GetStore()` across scene loads — always read from `ReefQLProvider` at point of use.
:::

## QueryStore

`QueryStore` is a cache of `IQueryObserver` instances keyed by `(query string, mode)`:

```csharp
// From IQueryData (e.g. a ScriptableObject)
IQueryObserver observer = ReefQLProvider.GetStore().Get(myQueryData);

// From IQuery (Reefs query asset)
IQueryObserver observer = ReefQLProvider.GetStore().Get(myQuery);
```

The store calls `observer.Init()` on first access, which seeds the initial state and (in RealTime mode) subscribes to the referenced blackboard keys.

`QueryStoreProvider` provides a scene-lifecycle-managed instance if you need to access the store outside of `ReefQLProvider`:

```csharp
QueryStore store = QueryStoreProvider.QueryStore();
```

## IQueryData

The minimal interface a query asset must implement:

```csharp
public interface IQueryData
{
    string Query { get; }
    QueryEvaluateMode EvaluateMode { get; }
}
```

Implement it on a `ScriptableObject` so designers can author queries in the Inspector:

```csharp
[CreateAssetMenu(menuName = "Ocean/Query")]
public class QueryAsset : ScriptableObject, IQueryData
{
    [SerializeField] private string _query;
    [SerializeField] private QueryEvaluateMode _mode = QueryEvaluateMode.RealTime;

    public string Query => _query;
    public QueryEvaluateMode EvaluateMode => _mode;
}
```

## BlackboardEvalContext

`BlackboardEvalContext` implements `IEvalContext` by reading from `IBlackboard`:

| IEvalContext method | Reads from |
|---------------------|-----------|
| `GetValue(key)` | `blackboard.Entries[key].CurrentValue` |
| `GetHistory(key)` | `blackboard.Entries[key].SnapshotHistory` |
| `GetCollection(key)` | `blackboard.ReadList<object>(key)` |
| `ResolveFunction(name, args)` | Registered `IQueryFunction` instances |
| `SubscribeToKey(key, onChange)` | `blackboard.OnAnyWrite` (R3 observable) |

You do not construct `BlackboardEvalContext` directly — use `ReefQLProvider.Get()`.

## Custom functions {#custom-functions}

Implement `IQueryFunction` to add a custom operand callable from queries:

```csharp
public class ThreatScoreFunction : IQueryFunction
{
    public string Name => "ThreatScore";

    public object Evaluate(object[] args)
    {
        string targetId = args[0]?.ToString();
        return ThreatSystem.GetScore(targetId);
    }

    public IEnumerable<string> GetDependencies(object[] args)
    {
        // Return the blackboard keys this function reads internally.
        // RealTime observers will subscribe to them automatically.
        string targetId = args[0]?.ToString();
        yield return $"Threat_{targetId}";
    }
}
```

Functions are discovered automatically at runtime via reflection — any non-abstract class that implements `IQueryFunction` is registered. No manual registration is needed.

Use it in a query:

```
ThreatScore(CurrentTarget) >= 8
```

::: tip GetDependencies
Always implement `GetDependencies` if your function reads blackboard keys internally. Without it, a RealTime observer won't subscribe to those keys and won't re-evaluate when they change.
:::

## QueryObserver lifecycle

```csharp
// 1. Obtain (first call: constructs + inits the observer)
var observer = ReefQLProvider.GetStore().Get(myQueryData);

// 2. Subscribe
observer.OnStateChanged += OnQueryChanged;

// 3. Read current state at any time
bool currentState = observer.State;

// 4. Dispose when done (automatic on scene load, or manual)
observer.Dispose();
observer.OnStateChanged -= OnQueryChanged;
```

For component-owned observers that should live only as long as the component:

```csharp
private IQueryObserver _observer;

void Awake()
{
    _observer = ReefQLProvider.GetStore().Get(_queryData);
    _observer.OnStateChanged += HandleQueryChanged;
}

void OnDestroy()
{
    _observer?.Dispose();
    if (_observer != null)
        _observer.OnStateChanged -= HandleQueryChanged;
}
```
