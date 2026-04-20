# Incremental Evaluation

`IncrementalEvaluator` is a dependency-aware, cached evaluator that sits alongside `QuerySession`. Where `QuerySession.Evaluate` re-evaluates the entire AST every call, `IncrementalEvaluator` tracks which sub-trees depend on which blackboard keys and only re-evaluates the parts affected by a given change.

## When to use it

`IncrementalEvaluator` is suited for reactive pipelines where:

- Blackboard keys change one at a time (most real-time game logic)
- The query has many terms and most of them are unaffected by any single change
- You want minimal CPU spend on each key write

For simple queries or cases where the whole blackboard is rebuilt at once, `QuerySession.Evaluate` is fine.

## Usage pattern

```csharp
var session = new QuerySession("EmissionA > 2 && COUNT(Phase = \"boss\") >= 3");
var evaluator = new IncrementalEvaluator(session.Ast);

// 1. Seed once — full evaluation, populates the result cache
bool initial = evaluator.Seed(ctx);

// 2. From now on, call Evaluate with the changed key
//    Only sub-trees depending on "EmissionA" are re-evaluated
bool updated = evaluator.Evaluate("EmissionA", ctx);

// 3. Later, Phase changes
bool updated2 = evaluator.Evaluate("Phase", ctx);
```

**`Seed(IEvalContext ctx)`** — walks every node and populates the cache. Call once after construction, before any incremental updates begin.

**`Evaluate(string changedKey, IEvalContext ctx)`** — only nodes whose dependency set includes `changedKey` are re-evaluated. All other nodes return their cached result immediately.

## Time-triggered re-evaluation

When the query contains windowed expressions, you also need time-driven re-evaluation. Use `EvaluateTime` when the clock reaches `NextScheduledTime`:

```csharp
void OnTick(double currentTime)
{
    if (evaluator.NextScheduledTime is double next && currentTime >= next)
        evaluator.EvaluateTime(ctx);
}
```

**`EvaluateTime(IEvalContext ctx)`** — only windowed sub-trees are re-evaluated. Key-dependent sub-trees return their cached result.

**`NextScheduledTime`** — the next time at which a windowed node may change state. `null` if no windowed expressions are present. Updated after every `Evaluate` or `EvaluateTime` call.

## COUNT and windowed state

`IncrementalEvaluator` maintains its own persistent `COUNT` and windowed interval state internally. Both accumulate across all calls for the lifetime of the evaluator instance — the same semantics as `QuerySession`, just with the caching layer on top.

## Full example

```csharp
var session   = new QuerySession("Health < 20 && COUNT(Phase = \"combat\") >= 3");
var evaluator = new IncrementalEvaluator(session.Ast);

// Seed once
evaluator.Seed(ctx);

// Subscribe to blackboard writes
blackboard.OnKeyChanged += (key) =>
{
    bool result = evaluator.Evaluate(key, ctx);
    if (result != _lastResult)
    {
        _lastResult = result;
        OnQueryChanged(result);
    }
};

// Subscribe to a clock key for windowed re-evaluation
blackboard.OnKeyChanged += (key) =>
{
    if (key != "Time") return;
    double currentTime = (double)ctx.GetValue("Time");
    if (evaluator.NextScheduledTime is double next && currentTime >= next)
    {
        bool result = evaluator.EvaluateTime(ctx);
        if (result != _lastResult)
        {
            _lastResult = result;
            OnQueryChanged(result);
        }
    }
};
```

::: tip
`IncrementalEvaluator` is what the Unity `QueryObserver` uses internally in RealTime mode. You only need to construct it yourself if you are building a custom reactive pipeline outside of Unity.
:::
