---
layout: home

hero:
  name: Reefs
  text: Reactive query language
  tagline: A game-first, designer-friendly format for blackboard conditions. Built for reactive evaluation, temporal history, collection checks, and the kinds of conditions that actually stay in sync.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Query Syntax
      link: /reference/syntax

features:
  - icon: ✍️
    title: Readable syntax
    details: Plain-text boolean expressions. No configuration, no boilerplate. Designers can read and edit queries without touching code.

  - icon: ⚡
    title: Reactive evaluation
    details: RealTime observers subscribe to exactly the blackboard keys they read. Re-evaluate automatically and fire callbacks only when the result flips.

  - icon: ⏳
    title: Temporal queries
    details: WAS latches true once a condition was ever satisfied. CHANGED TO and CHANGED FROM fire on value transitions.

  - icon: 📦
    title: Collection queries
    details: CONTAINS checks against list blackboard entries. Multi-value set syntax lets you test several values in one expression.

  - icon: 🧩
    title: Extensible functions
    details: Plug in custom function operands via IQueryFunction. Functions declare their own blackboard dependencies for correct RealTime subscriptions.

  - icon: 🔌
    title: Unity-free core
    details: The evaluator DLL has no UnityEngine reference. Plug in any blackboard — or a plain dictionary — via IEvalContext.
---
