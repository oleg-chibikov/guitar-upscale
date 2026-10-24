# Design

Read this before you add or change anything on the screen. It lists the colors, the shared components and the habits that keep the app looking like one app.

## Build from the shared components

Reach for [uiFramework](../src/app/components/uiFramework) first. Each wrapper already knows the theme, the chords side and the screen reader labels.

| Need                                 | Use                                                                         |
| ------------------------------------ | --------------------------------------------------------------------------- |
| a button with an icon                | `IconButtonWrapper`. `toggle` for on and off, `emphasis` for the main one   |
| a row of controls over the fretboard | `Panel`, with `BarDivider` between groups and `bare` for a group in a group |
| a dialog or a side drawer            | `DialogWrapper`. Pass `anchor` to get a drawer                              |
| a yes or no question                 | `ConfirmationDialog`                                                        |
| a dropdown                           | `SelectWrapper`, or `EnumSelector` when the options come from an enum       |
| a number picked from a list          | `ValueDialogControl` in a bar, `StepSlider` in settings                     |
| a free number                        | `Slider`                                                                    |
| an on and off setting with a label   | `CheckBox`                                                                  |
| a label over a select or a slider    | `ControlWithLabel`. The control inside reads the label id from it           |
| a section that opens and closes      | `Expander`                                                                  |

Plain MUI is fine for `Button`, `Typography`, `Alert`, `Tooltip` and `Menu`. Icons come from `@mui/icons-material`.

## Colors

Each color has a light and a dark value. The two themes look different on purpose:

- **Light** coffee tones: cream background `#fdf6f1`, latte buttons `#d2a179`, dark brown text `#2e1f1b`.
- **Dark** night blue: background `#001b2e`, steel blue buttons `#537692`, near white text `#f2f2f2`.

A color is written in three places. A new color goes into each one that draws it:

1. [globals.css](../src/app/globals.css) as a Tailwind pair, `--color-name-light` and `--color-name-dark`.
2. [palette.ts](../src/app/helpers/canvas/palette.ts) for the fretboard and piano roll canvas. Canvas can't read Tailwind classes.
3. [MuiThemeProvider.tsx](../src/app/context/MuiThemeProvider.tsx) for MUI `primary` and `secondary`.

| Role                        | Tailwind name                                   | Where it shows                        |
| --------------------------- | ----------------------------------------------- | ------------------------------------- |
| page and text               | `background`, `foreground`                      | the whole screen                      |
| floating bars               | `bar`, `bar_border`                             | `Panel` frames over the fretboard     |
| controls inside a bar       | `control`, `control_border`                     | icon buttons                          |
| frets                       | `fret_marker`, `fret_marker_match`              | fret cells                            |
| buttons and pressed buttons | `button`, `button_pressed`                      | chord buttons                         |
| highlight                   | `accent`, `accent_stronger`, `accent_strongest` | active and detected things            |
| off                         | `disabled`, `disabled_match`                    | frets behind the capo, locked options |

## Pick the light or dark class

The person can pick a theme different from the OS, so the Tailwind `dark:` variant doesn't work here. Read the theme from the store and pick the class:

```tsx
const theme = useUiSelector((s) => s.theme);
className={theme === Theme.Light ? "bg-bar-light" : "bg-bar-dark"}
```

Only [AppShell.tsx](../src/app/components/AppShell.tsx) uses `dark:`. It draws before the store loads, so it follows the OS.

## Layout

- **The fretboard fills the screen.** Controls float over it in `Panel` bars with rounded corners and a see-through background.
- **Chords switch sides.** Settings move the chords left or right. A bar with `enableReverse` flips its order to stay on the other side. A new bar near the chords needs the same.
- **Low screens get smaller.** `maxhmd:` hits screens under 600px tall and `maxhlg:` under 800px. Check a phone held sideways.
- **Phones held upright** match `portraittouch:`.

## Touch first

- **Hold works like right click.** `IconButtonWrapper` fires `onLongPress` after 500ms or on right click. Put the second action of a button there, like "Download as Guitar Pro (hold for MIDI)".
- **Text can't be selected.** `globals.css` turns selection and the tap flash off for the whole page, so a held finger plays a note.
- **Buttons stay small.** `IconButtonWrapper` is MUI `size="small"` with 4px padding. Keep a bar to one row on a phone.

## Text

- **Font sizes are small.** Body text is `0.85rem` and buttons `0.75rem`. Use the MUI `Typography` variants instead of setting a size.
- **Each icon button needs a tooltip.** The tooltip also becomes the button's screen reader name.
- **Tooltips say what happens**, in sentence case. A keyboard shortcut goes in brackets at the end: "Zoom in (H, or Ctrl+wheel)".
- **Dialog titles are short nouns**: "Settings", "Songs", "Strumming pattern editor".

## Dialogs load late

A dialog's code loads the first time it opens. Follow the shape of [SettingsViewWrapper.tsx](../src/app/components/settings/SettingsViewWrapper.tsx):

1. Import the dialog with `next/dynamic`.
2. Wrap it in `LazyLoadWrapper`, with `isOpen` read from the store.
3. Put the `…Wrapper` component on the page, not the dialog itself.

`ValueDialogControl` is the exception. It loads at once because a late tempo dialog feels broken.
