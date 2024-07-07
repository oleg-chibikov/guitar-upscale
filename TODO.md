More chords
Ads
more examples
7,8 string guitars
Feedback form
get the formula to avoid hardcoding each string height offset
youtube videos for each scale
High string at the bottom mode
Slash chords? when the main bass note is out of the chord
WaitForNextHalfBeat could make the melody offbeat - we need to store what tick to wait for

info about chord detection
https://www.oolimo.com/en/guitar-chords/analyze
or https://jguitar.com/chordname

piano roll editor for looper/recording

Can we avoid using pre-built chords for chord detection?

Piano roll:
Update eventsByTick on changes. do we need a better structure? Should we do it after each move or on piano roll close?
move Axes (both) when the scroll position changes
copy note instead of move when ctrl pressed (what about mobile?)
apply to looper and to recording, not only to midi upload
For looper we'll need another dialog showing all the tracks. Alternatively we can have buttons under the play buttons
For recording we'll need to have the ability to replay the recording first
Draggging over the X-axis should change current playback position. Should we adjust globalCurrentTick? Note that when we go forwards/backwards we don't do that - probably we should!
Clicking piano notes should produce sound.
