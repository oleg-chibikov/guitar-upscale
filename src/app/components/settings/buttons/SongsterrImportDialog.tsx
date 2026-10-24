"use client";
import { DialogProps } from "@/app/components/DialogProps";
import { DialogWrapper } from "@/app/components/uiFramework/DialogWrapper";
import { AlertType } from "@/app/data/alertType";
import { SONGSTERR_IMPORT_DIALOG } from "@/app/data/elementIds";
import { getExampleName } from "@/app/data/example";
import {
  SongsterrMeta,
  SongsterrSearchResult,
  SongsterrTrack,
  listPlayableTrackIndexes,
  pickMelodyIndex,
} from "@/app/engine/songs/songsterr";
import { setAndShowAlert } from "@/app/store/uiSlice";
import Search from "@mui/icons-material/Search";
import {
  Alert,
  Autocomplete,
  Button,
  Checkbox,
  CircularProgress,
  DialogActions,
  InputAdornment,
  ListItemText,
  MenuItem,
  TextField,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

const LOG_PREFIX = "Songsterr import: ";
const NO_BASS = -1;
const SEARCH_DELAY_MS = 400;
const MIN_QUERY_LENGTH = 2;

// The theme paints select text black for the light SelectWrapper background.
const selectTextSx = {
  "& .MuiInputBase-root .MuiSelect-select": { color: "text.primary" },
};

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const trackName = (meta: SongsterrMeta, index: number) =>
  meta.tracks[index].name || meta.tracks[index].instrument;

const trackLabel = (meta: SongsterrMeta, index: number) =>
  `${index + 1}. ${trackName(meta, index)} (${meta.tracks[index].instrument})`;

// A multiple select gives an array, or a comma separated string after autofill.
const toIndexes = (value: unknown) =>
  (Array.isArray(value) ? value : String(value).split(","))
    .filter((index) => index !== "")
    .map(Number);

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
  const [extraIndexes, setExtraIndexes] = useState<number[]>([]);
  const [melodyTrack, setMelodyTrack] = useState<SongsterrTrack>();
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();

  const isQueryLongEnough = searchText.trim().length >= MIN_QUERY_LENGTH;
  const playable = meta ? listPlayableTrackIndexes(meta) : [];
  // a Songsterr track goes into the song once, so the melody and the bass stay out of this list
  const extraOptions = playable.filter(
    (index) => index !== trackIndex && index !== bassIndex,
  );
  const pickedExtras = extraOptions.filter((index) =>
    extraIndexes.includes(index),
  );

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
      const melodyIndex = pickMelodyIndex(songMeta);
      if (melodyIndex === undefined) {
        throw new Error("The song has only drums or empty tracks");
      }
      const bass = songMeta.popularTrackBass ?? NO_BASS;
      const isBassPlayable =
        bass !== melodyIndex &&
        listPlayableTrackIndexes(songMeta).includes(bass);
      setMeta(songMeta);
      setBassIndex(isBassPlayable ? bass : NO_BASS);
      setExtraIndexes(listPlayableTrackIndexes(songMeta));
      await loadTrack(songMeta, melodyIndex);
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
        extraIndexes: pickedExtras,
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
            sx={selectTextSx}
            value={trackIndex}
            disabled={busy !== undefined}
            onChange={(e) => void chooseTrack(Number(e.target.value))}
          >
            {playable.map((index) => (
              <MenuItem
                key={index}
                value={index}
                disabled={index === bassIndex}
              >
                {trackLabel(meta, index)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Bass track, it picks the chords"
            sx={selectTextSx}
            value={bassIndex}
            disabled={busy !== undefined}
            onChange={(e) => setBassIndex(Number(e.target.value))}
          >
            <MenuItem value={NO_BASS}>None</MenuItem>
            {playable.map((index) => (
              <MenuItem
                key={index}
                value={index}
                disabled={index === trackIndex}
              >
                {trackLabel(meta, index)}
              </MenuItem>
            ))}
          </TextField>
          {extraOptions.length > 0 && (
            <TextField
              select
              size="small"
              label="More tracks, drums stay out"
              sx={selectTextSx}
              value={pickedExtras}
              disabled={busy !== undefined}
              onChange={(e) => setExtraIndexes(toIndexes(e.target.value))}
              slotProps={{
                inputLabel: { shrink: true },
                select: {
                  multiple: true,
                  displayEmpty: true,
                  renderValue: (selected) =>
                    (selected as number[]).length === 0
                      ? "None"
                      : (selected as number[])
                          .map((index) => trackName(meta, index))
                          .join(", "),
                },
              }}
            >
              {extraOptions.map((index) => (
                <MenuItem key={index} value={index}>
                  <Checkbox
                    size="small"
                    checked={pickedExtras.includes(index)}
                  />
                  <ListItemText primary={trackLabel(meta, index)} />
                </MenuItem>
              ))}
            </TextField>
          )}
        </>
      )}

      {melodyTrack && (
        <span>
          Adds all {melodyTrack.measures.length} bars. Cut them in the piano
          roll.
        </span>
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
