---
layout: home

hero:
  name: Reefs
  text: Reactive query language
  tagline: Plain-text boolean expressions evaluated against a blackboard. Reactive subscriptions, temporal history, windowed time constraints, and incremental evaluation — built for game logic that stays in sync.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Syntax Reference
      link: /reference/syntax

features:
  - icon: ✍️
    title: Readable syntax
    details: Plain-text boolean expressions. Comparisons, logic, arithmetic, set membership, and intervals — all in a format designers can read and edit without touching code.

  - icon: ⚡
    title: Reactive evaluation
    details: RealTime observers subscribe to exactly the blackboard keys they read. Re-evaluate automatically on any relevant change and fire a callback only when the result flips.

  - icon: ⏱️
    title: Windowed queries
    details: Constrain any condition with a time boundary. Duration mode checks how long a condition has been continuously true. Window mode checks whether it was true at any point in a sliding time range.

  - icon: 🕰️
    title: Temporal history
    details: WAS latches true once a condition was ever satisfied. CHANGED, CHANGED TO, CHANGED FROM, INCREASED, and DECREASED fire on specific value transitions. COUNT tracks rising-edge activations across a session.

  - icon: ➕
    title: Arithmetic & intervals
    details: Full arithmetic expressions anywhere an operand is expected. IN tests set membership or numeric intervals with inclusive and exclusive bounds. NOT IN inverts both forms.

  - icon: 🧩
    title: Extensible functions
    details: Plug in custom function operands via IQueryFunction. Functions declare their own blackboard dependencies so RealTime observers subscribe to them automatically.

  - icon: 🔌
    title: Unity-free core
    details: The evaluator DLL has no UnityEngine reference. Plug in any blackboard — or a plain dictionary — via IEvalContext. The Unity adapter is a separate layer.
---
