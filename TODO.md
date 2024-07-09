More chords
Ads
more examples
7,8 string guitars
Feedback form
get the formula to avoid hardcoding each string height offset
youtube videos for each scale
High string at the bottom mode
WaitForNextHalfBeat could make the melody offbeat - we need to store what tick to wait for

info about chord detection
https://www.oolimo.com/en/guitar-chords/analyze
or https://jguitar.com/chordname

piano roll editor for looper/recording

Can we avoid using pre-built chords for chord detection?

Piano roll:
Undo-redo (use event sourcing technique)
copy note instead of move when ctrl pressed (what about mobile?)
move with touch gestures too
Panel with actions on pianoRoll. It probably should be the same as play panel, but extended with tools or two different panels
For looper we'll need another dialog showing all the tracks. Alternatively we can have buttons under the play buttons
Draggging over the X-axis should change current playback position. Should we adjust globalCurrentTick? Note that when we go forwards/backwards we don't do that - probably we should!
for chords - see what chords available for the new note. Prefer the same Mode, but if no - use the first available or better show a dialog to choose from available. also show it if not available on the current note
Zoom in/out - gesture + buttons/selection mode
apply all this stuff to looper
show the vertical line at the current tick
move event only in 1 direction by holding ctrl once you start moving it
quantize events

BUG: reset playback then change scale then play - all the notes are played at once
