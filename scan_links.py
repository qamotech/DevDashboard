"""Focused link check for the flat published page set."""

from quality_check import errors

print(f"BROKEN_LINKS={len(errors)}")
