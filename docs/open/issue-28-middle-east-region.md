# Issue #28 — Middle East conventional learning region

GitHub: https://github.com/BenWassa/flag/issues/28

## Goal

Add **Middle East** as a learner-facing conventional region without corrupting canonical continent/subregion classification.

## Key decision

Learning scopes may overlap canonical geography metadata. Egypt remains canonically African while participating in the Middle East learning scope; Armenia, Azerbaijan and Georgia are not silently treated as Middle Eastern by default.

## Architecture implication

Separate canonical geographic classification from reusable learner-facing scope membership. Do not duplicate country records or hand-code membership independently per domain.

This work should integrate with the future Atlas region-detail and mastery model once global domain coverage reaches the scope.
