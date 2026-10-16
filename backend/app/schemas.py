"""Request and response models shared by the API routes."""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field

Quality = Literal["major", "minor"]
RootPc = Annotated[int, Field(ge=0, le=11)]
StringSet = Annotated[int, Field(ge=0, le=3)]
Bpm = Annotated[int, Field(ge=30, le=160)]
Mode = Literal["learn", "comp"]
CompInstrument = Literal["piano", "guitar"]


class Settings(BaseModel):
    """The chord learning mode shows, and how comping is set up."""

    learn_key: RootPc = 0
    learn_quality: Quality = "major"
    learn_string_set: StringSet = 2
    bpm: Bpm = 60
    show_labels: bool = True
    mode: Mode = "learn"
    comp_key: RootPc = 7
    # The progression list lives in the frontend; an unknown id falls back there.
    comp_progression: Annotated[str, Field(min_length=1, max_length=40)] = "I-V-vi-IV"
    comp_string_set: StringSet = 2
    comp_instrument: CompInstrument = "piano"
    comp_bpm: Bpm = 80
