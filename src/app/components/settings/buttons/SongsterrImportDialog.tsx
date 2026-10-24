"use client";
import { DialogProps } from "@/app/components/DialogProps";
import { DialogWrapper } from "@/app/components/uiFramework/DialogWrapper";
import { AlertType } from "@/app/data/alertType";
import { SONGSTERR_IMPORT_DIALOG } from "@/app/data/elementIds";
import { getExampleName } from "@/app/data/example";
import {
  SongsterrMeta,
  SongsterrSearchResult,
  SongsterrSection,
  SongsterrTrack,
  listSections,
} from "@/app/engine/songs/songsterr";
import { setAndShowAlert } from "@/app/store/uiSlice";
import Search from "@mui/icons-material/Search";
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  CircularProgress,
  DialogActions,
  InputAdornment,
  ListItemText,
  MenuItem,
  Slider,
  TextField,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

const LOG_PREFIX = "Songsterr import: ";
const NO_BASS = -1;
const SEARCH_DELAY_MS = 400;
const MIN_QUERY_LENGTH = 2;

type Range = [number, number];

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const trackLabel = (meta: SongsterrMeta, index: number) => {
  const track = meta.tracks[index];
  return `${index + 1}. ${track.name || track.instrument} (${track.instrument})`;
};

// The title tells apart songs added from different parts of one song.
const getTitle = (
  meta: SongsterrMeta,
  [from, to]: Range,
  measureCount: number,
  sections: SongsterrSection[],
) => {
  if (from === 0 && to === measureCount - 1) {
    return meta.title;
  }
  const section = sections.find((s) => s.from === from && s.to === to);
  return `${meta.title} (${section?.name ?? `bars ${from + 1}-${to + 1}`})`;
};

export const SongsterrImportDialog: React.FC<DialogProps> = ({
  isOpen,
  handleCloseDialog,
}) => {
  const dispatch = useDispatch();
  const [query, setQuery] = useState("");
  // what the person typed, while query also takes the chosen song's name
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<SongsterrSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [song, setSong] = useState<SongsterrSearchResult | null>(null);
  const [meta, setMeta] = useState<SongsterrMeta>();
  const [trackIndex, setTrackIndex] = useState(0);
  const [bassIndex, setBassIndex] = useState(NO_BASS);
  const [melodyTrack, setMelodyTrack] = useState<SongsterrTrack>();
  const [range, setRange] = useState<Range>([0, 0]);
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();

  const isQueryLongEnough = searchText.trim().length >= MIN_QUERY_LENGTH;

  const measureCount = melodyTrack?.measures.length ?? 0;
  const sections = melodyTrack ? listSections(melodyTrack.measures) : [];

  const run = async (label: string, task: () => Promise<void>) => {
    setBusy(label);
    setError(undefined);
    try {
      await task();
    } catch (e) {
      console.error(LOG_PREFIX + label, e);
      setError(errorText(e));
    } finally {
      setBusy(undefined);
    }
  };

  // Searches once typing stops, and drops answers to older queries.
  useEffect(() => {
    const pattern = searchText.trim();
    if (pattern.length < MIN_QUERY_LENGTH) {
      return;
    }
    let isStale = false;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const { searchSongsterr } =
            await import("@/app/engine/songs/songsterrImport");
          const found = await searchSongsterr(pattern);
          if (!isStale) {
            setResults(found);
            setError(undefined);
          }
        } catch (e) {
          if (!isStale) {
            console.error(LOG_PREFIX + "Searching", e);
            setError(errorText(e));
          }
        } finally {
          if (!isStale) {
            setIsSearching(false);
          }
        }
      })();
    }, SEARCH_DELAY_MS);
    return () => {
      isStale = true;
      clearTimeout(timer);
    };
  }, [searchText]);

  const loadTrack = async (songMeta: SongsterrMeta, index: number) => {
    const { loadSongsterrTrack } =
      await import("@/app/engine/songs/songsterrImport");
    const track = await loadSongsterrTrack(songMeta, index);
    setTrackIndex(index);
    setMelodyTrack(track);
    setRange(([from, to]) =>
      to > 0 && to < track.measures.length
        ? [from, to]
        : [0, track.measures.length - 1],
    );
  };

  const chooseSong = (chosen: SongsterrSearchResult | null) => {
    setSong(chosen);
    setMeta(undefined);
    setMelodyTrack(undefined);
    if (chosen) {
      void loadSong(chosen);
    }
  };

  const loadSong = (chosen: SongsterrSearchResult) =>
    run("Loading the song...", async () => {
      const { loadSongsterrMeta } =
        await import("@/app/engine/songs/songsterrImport");
      const songMeta = await loadSongsterrMeta(chosen.songId);
      setRange([0, 0]);
      setMeta(songMeta);
      setBassIndex(songMeta.popularTrackBass ?? NO_BASS);
      await loadTrack(songMeta, songMeta.popularTrack ?? 0);
    });

  const chooseTrack = (index: number) =>
    meta && run("Loading the track...", () => loadTrack(meta, index));

  const add = () =>
    meta &&
    melodyTrack &&
    run("Adding the song...", async () => {
      const { importSongsterrSong } =
        await import("@/app/engine/songs/songsterrImport");
      const { songPlayRequests } =
        await import("@/app/engine/songs/songLibrary");
      const { example } = await importSongsterrSong({
        meta,
        melodyTrack,
        bassIndex: bassIndex === NO_BASS ? undefined : bassIndex,
        from: range[0],
        to: range[1],
        title: getTitle(meta, range, measureCount, sections),
      });
      dispatch(
        setAndShowAlert({
          message: `Added ${getExampleName(example)} to ${example.scale} (${
            example.scaleGroup
          })`,
          alertType: AlertType.Success,
        }),
      );
      songPlayRequests.next(example);
      handleCloseDialog();
    });

  return (
    <DialogWrapper
      isOpen={isOpen}
      close={handleCloseDialog}
      headerText="Add a song from Songsterr"
      id={SONGSTERR_IMPORT_DIALOG}
    >
      <Autocomplete
        options={isQueryLongEnough ? results : []}
        value={song}
        inputValue={query}
        loading={isQueryLongEnough && isSearching}
        disabled={busy !== undefined}
        // Songsterr already filtered the options by the query
        filterOptions={(options) => options}
        getOptionLabel={(option) => `${option.artist} - ${option.title}`}
        isOptionEqualToValue={(option, value) => option.songId === value.songId}
        onInputChange={(_, value, reason) => {
          setQuery(value);
          if (reason === "input" || reason === "clear") {
            setSearchText(value);
            setIsSearching(value.trim().length >= MIN_QUERY_LENGTH);
          }
        }}
        onChange={(_, value) => chooseSong(value)}
        noOptionsText={
          !isQueryLongEnough ? "Type a band or a song" : "No songs found"
        }
        // two songs can share a name, and MUI keys the options by name
        getOptionKey={(option) => option.songId}
        renderOption={({ key, ...props }, option) => (
          <li key={key} {...props}>
            <ListItemText primary={option.title} secondary={option.artist} />
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            autoFocus
            placeholder="Band or song"
            slotProps={{
              ...params.slotProps,
              input: {
                ...params.slotProps.input,
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <>
                    {isQueryLongEnough && isSearching && (
                      <CircularProgress size={18} />
                    )}
                    {params.slotProps.input.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
        size="small"
      />

      {error !== undefined && <Alert severity="error">{error}</Alert>}

      {meta && (
        <>
          <TextField
            select
            size="small"
            label="Melody track"
            value={trackIndex}
            disabled={busy !== undefined}
            onChange={(e) => void chooseTrack(Number(e.target.value))}
          >
            {meta.tracks.map((_, index) => (
              <MenuItem key={index} value={index}>
                {trackLabel(meta, index)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Bass track, it picks the chords"
            value={bassIndex}
            disabled={busy !== undefined}
            onChange={(e) => setBassIndex(Number(e.target.value))}
          >
            <MenuItem value={NO_BASS}>None</MenuItem>
            {meta.tracks.map((_, index) => (
              <MenuItem key={index} value={index}>
                {trackLabel(meta, index)}
              </MenuItem>
            ))}
          </TextField>
        </>
      )}

      {meta && melodyTrack && (
        <>
          {sections.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {sections.map((section) => (
                <Chip
                  key={section.from}
                  size="small"
                  label={`${section.name} (${section.from + 1})`}
                  color={
                    range[0] === section.from && range[1] === section.to
                      ? "primary"
                      : "default"
                  }
                  onClick={() => setRange([section.from, section.to])}
                />
              ))}
            </div>
          )}
          <span>
            Bars {range[0] + 1} to {range[1] + 1} of {measureCount}
          </span>
          <Slider
            className="mx-2 w-auto"
            min={1}
            max={measureCount}
            value={[range[0] + 1, range[1] + 1]}
            valueLabelDisplay="auto"
            disableSwap
            onChange={(_, value) => {
              const [from, to] = value as number[];
              setRange([from - 1, to - 1]);
            }}
          />
        </>
      )}

      <DialogActions>
        {busy !== undefined && (
          <>
            <CircularProgress size={20} />
            <span>{busy}</span>
          </>
        )}
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!melodyTrack || busy !== undefined}
          onClick={() => void add()}
        >
          Add
        </Button>
      </DialogActions>
    </DialogWrapper>
  );
};
