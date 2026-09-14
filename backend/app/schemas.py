"""Request and response models shared by the API routes."""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field

Quality = Literal["major", "minor"]
Inversion = Literal["root", "first", "second"]
RootPc = Annotated[int, Field(ge=0, le=11)]
StringSet = Annotated[int, Field(ge=0, le=3)]
Bpm = Annotated[int, Field(ge=30, le=160)]
Mode = Literal["drill", "comp"]
CompInstrument = Literal["piano", "guitar"]


class Settings(BaseModel):
    """What the practice generator is allowed to pick from, and how comping is set up."""

    qualities: list[Quality] = Field(default_factory=lambda: ["major"])
    sets: list[StringSet] = Field(default_factory=lambda: [0, 1, 2, 3])
    inversions: list[Inversion] = Field(default_factory=lambda: ["root", "first", "second"])
    roots: list[RootPc] = Field(default_factory=lambda: list(range(12)))
    bpm: Bpm = 60
    show_labels: bool = True
    mode: Mode = "drill"
    comp_key: RootPc = 7
    # The progression list lives in the frontend; an unknown id falls back there.
    comp_progression: Annotated[str, Field(min_length=1, max_length=40)] = "I-V-vi-IV"
    comp_string_set: StringSet = 2
    comp_instrument: CompInstrument = "piano"
    comp_bpm: Bpm = 80


class DrillItem(BaseModel):
    """What you practise in one go: every inversion of this chord on this string
    set, cycled from the lowest position on the neck to the highest."""

    root_pc: RootPc
    quality: Quality
    string_set: StringSet


class TriadItem(DrillItem):
    """One step of a drill. The frontend turns this into fret positions."""

    inversion: Inversion


class ItemStat(TriadItem):
    count: int
    last_practised_at: str | None


class RootStat(BaseModel):
    root_pc: RootPc
    count: int


class PracticeStats(BaseModel):
    total: int
    by_root: list[RootStat]
    items: list[ItemStat]


class PracticeEvent(TriadItem):
    id: int
    practised_at: str
