// where a MIDI recording goes when it stops
export enum RecordTarget {
  NewSong = "newSong",
  // a new track in the loaded song. Without a loaded song it makes a new song
  NewTrack = "newTrack",
}
