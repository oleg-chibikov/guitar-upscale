// midi-writer-js 3.2 lists no "types" in its exports map, so TypeScript can't find its typings.
declare module "midi-writer-js" {
  import Midi from "midi-writer-js/build/types/main";
  export default Midi;
}
