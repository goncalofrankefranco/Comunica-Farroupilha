---
name: "Grêmio Comunica Farroupilha"
description: "An open, student-facing visual system built around the original orange megaphone and school navy."
colors:
  orange: "#ff5000"
  orange-dark: "#b83d00"
  orange-hover: "#ee4b00"
  navy: "#153d66"
  paper: "#fff"
  soft: "#f3f5f6"
  ink: "#18334e"
  muted: "#526475"
  line: "#d4dde5"
  action-ink: "#061d32"
  control-border: "#bac8d4"
  control-hover: "#e2e9ef"
  light-hover: "#e4edf3"
  on-navy-muted: "#d6e2ed"
  on-navy-accent: "#ffa77f"
typography:
  display:
    fontFamily: "'Archivo Variable', sans-serif"
    fontSize: "clamp(3.8rem, 7vw, 6rem)"
    fontWeight: 780
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "'Archivo Variable', sans-serif"
    fontSize: "clamp(2.15rem, 3.8vw, 3.4rem)"
    fontWeight: 780
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  title:
    fontFamily: "'Archivo Variable', sans-serif"
    fontSize: "23px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  demo-title:
    fontFamily: "'Archivo Variable', sans-serif"
    fontSize: "29px"
    fontWeight: 750
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  body:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: "14px"
    fontWeight: 750
    lineHeight: 1.65
  navigation:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: "13px"
    fontWeight: 650
    lineHeight: 1.65
rounded:
  button: "7px"
  choice: "8px"
spacing:
  12: "12px"
  18: "18px"
  24: "24px"
  30: "30px"
  32: "32px"
  65: "65px"
  105: "105px"
components:
  button-orange:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.action-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "14px 22px"
  button-orange-hover:
    backgroundColor: "{colors.orange-hover}"
    textColor: "{colors.action-ink}"
  button-light:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "14px 22px"
  button-light-hover:
    backgroundColor: "{colors.light-hover}"
    textColor: "{colors.navy}"
  listening-choice:
    backgroundColor: "transparent"
    textColor: "{colors.navy}"
    rounded: "{rounded.choice}"
    padding: "18px 22px"
  listening-choice-hover:
    backgroundColor: "{colors.control-hover}"
  listening-choice-selected:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.paper}"
  navigation:
    typography: "{typography.navigation}"
    textColor: "{colors.ink}"
    padding: "12px 0"
  text-link:
    textColor: "{colors.ink}"
    padding: "0 0 7px"
  module-row:
    padding: "32px 0"
  development-status:
    textColor: "{colors.paper}"
---

# Design System: Grêmio Comunica Farroupilha

## Overview

**Creative North Star: "Student campaign poster"**

The original orange megaphone, school navy and white space give the interface a direct, approachable student voice. Heavy Archivo headlines establish emphasis; Manrope keeps explanations and controls clear. Open rows and broad color bands provide structure with little visual enclosure.

This is the implemented baseline extracted from the landing page on 2026-09-04, not a claim of approved visual comps. Preserve the user's original logo artwork and institutional marks. Page-specific composition lives in `.impeccable/surfaces/src-app-page-tsx.md`; this document records the reusable visual decisions.

**Key Characteristics:**

- Original orange megaphone and school navy on white.
- Heavy, tightly spaced headlines with readable supporting text.
- Flat surfaces, open rows and restrained rounded controls.
- Short interaction feedback with an explicit reduced-motion path.

## Colors

Bright orange carries energy; school navy supplies structure; cool neutrals support long-form reading. The frontmatter is the normative token inventory. State colors extracted from literal CSS remain distinct from the custom properties used in the application. The sidecar's generated tonal ramps are previews, not additional shipping palette tokens.

### Primary

- **Megaphone orange** (`orange`): logo-adjacent action fills and text selection; pair action fills with `action-ink`.
- **Dark orange** (`orange-dark`): highlighted headline words, small directional accents and focus outlines on light backgrounds.
- **Action hover orange** (`orange-hover`): the orange action's hover fill.

### Secondary

- **School navy** (`navy`): structural bands, selected choices, rules, controls and emphasis.
- **Warm accent on navy** (`on-navy-accent`): selected-choice arrows and focus outlines within the closing band.

### Neutral

- **White paper** (`paper`) and **cool soft surface** (`soft`): base canvas and a quiet contrasting section surface.
- **Reading ink** (`ink`) and **muted blue-gray** (`muted`): primary and supporting text on light backgrounds.
- **Deep action ink** (`action-ink`): orange-button text and selection text.
- **Divider gray** (`line`) and **control border** (`control-border`): open-content rules and unselected option outlines.
- **Control hover** (`control-hover`) and **light action hover** (`light-hover`): feedback on pale controls.
- **Muted text on navy** (`on-navy-muted`): supporting copy on dark bands.

**The Contrast Pairing Rule.** Keep dark action ink on the bright orange button. Use dark orange for orange text on white; the logo's bright orange is not the text-emphasis color.

## Typography

**Display Font:** Archivo Variable (with sans-serif)

**Body Font:** Manrope Variable (with sans-serif)

Both variable fonts are self-hosted through Fontsource imports in the root layout. The browser uses balanced wrapping on headings. No distinct mono or uppercase label family is implemented.

**Character:** Archivo provides the bold poster voice; Manrope gives the surrounding copy a calmer, rounded rhythm. The observed hierarchy uses fluid display sizes and explicit small text sizes, rather than a mathematical modular scale.

### Hierarchy

- **Display** (`display`): primary page headline; mobile sizing changes in Layout.
- **Headline** (`headline`): section headings. The closing band uses a larger fluid range (`clamp(2.5rem, 4.5vw, 4rem)`).
- **Title** (`title`): open module-row titles; the listening result uses `demo-title`.
- **Body** (`body`): inherited baseline. Supporting paragraphs commonly use smaller text (14–15px) with generous line-height (1.8–1.85); introductory and question text uses stronger emphasis (21px, weight 600, line-height 1.5–1.55).
- **Label** (`label`): primary action labels; navigation has its own lighter `navigation` role. Local explanatory labels range from 11–13px.

Reading widths are deliberately bounded: the hero description (42ch), proposal copy (62ch), and demonstration follow-up (66ch). Keep these limits attached to their reading contexts rather than making every paragraph equally wide.

## Layout

The main centered container has a maximum width (1240px) and desktop side space (48px each). The header is wider, capped at 1340px with 32px side space. Desktop sections use generous vertical padding (105px), split copy/art or copy/content grids, and open horizontal rows. The demonstration has a fixed option column (360px) beside a flexible result, with a 65px gap.

- At widths up to 1050px, main side space becomes 32px, gaps tighten, and the demonstration option column becomes 280px with a 36px gap.
- At widths up to 700px, main side space becomes 20px and header side space 16px. Split sections and module rows become one column, section padding becomes 65px, the footer wraps, and only the primary exploration link remains in header navigation. There is no mobile menu drawer.
- Mobile display type uses `clamp(3.2rem, 12.8vw, 5.4rem)`. Mobile controls, copy and title adjustments belong to their component rules; the interface does not simply scale the whole page down.
- At widths of at least 1600px, the hero gains top space (85px) and separation before its footer (80px); content remains capped.

The listening result reserves vertical space (370px desktop, 420px mobile) to limit shifts between examples. Anchor navigation has top scroll clearance (28px). The current header is neither fixed nor sticky.

## Elevation & Depth

The current system has no box shadows or gradients. White, soft gray and navy bands establish depth through tone. Thin rules divide open content; a stronger navy rule introduces the listening result. Controls stay flat, including hover and selection states.

**The Flat Surface Rule.** Continue the existing tonal and border separation before introducing elevation to an established component.

## Shapes

Large content areas and bands have square edges. Filled action controls have gently rounded corners (`rounded.button`); listening options use the slightly larger `rounded.choice`. A small circular status dot is the only repeated pill-like silhouette. The arrow is a simple rounded-stroke inline SVG, normally 24px, with smaller contextual sizes. The small artwork caption tilts slightly; this is a landing-specific detail, not a default transform for text.

## Components

### Buttons

Confident, compact filled links with a directional arrow. Orange actions sit on light backgrounds; white actions sit on navy. Their shared desktop minimum height is 54px, gap 26px, and padding is defined in the frontmatter. Mobile uses a 50px minimum height, 13px labels and padding of 13px 20px.

Hover changes the background and shifts the arrow right (4px). Background/color transitions take 0.2s; arrows use a 0.2s ease transition. There is no separate pressed, disabled or loading treatment in this landing.

### Listening choices and result

Outlined full-width buttons form a vertical choice group with a 12px gap. Each has an explicit border (1px), a 67px minimum height and a 15px semibold label. Hover uses the pale control surface with a navy border. Selection uses navy fill, white text and a warm diagonal arrow; `aria-pressed` exposes that state. Mobile choices use a 9px gap, 54px minimum height, 14px labels and padding of 13px 17px.

The result is an open content block below a navy top rule (2px), with a polite, atomic live region. Choosing an example updates local component state; it does not submit or store answers. Keep the visible demonstration disclaimer beside this interaction. Each result change reveals the content over 0.38s using `cubic-bezier(.16,1,.3,1)`, animating opacity from 0.7 to 1 and clip-path from `inset(0 0 12% 0)` to `inset(0 0 0 0)`.

### Navigation and text links

Header links use the navigation type token and underline on hover. The primary navigation link includes a diagonal arrow. On mobile the two secondary links are hidden, while the exploration action remains visible. Editorial text links have a thin navy underline and a diagonal arrow that shifts on hover. The brand and return link use page anchors; no active-section indicator is implemented.

### Open module rows

Titles, descriptions and a short emphasized outcome share three columns (1fr / 1.3fr / 0.9fr), separated by gaps (45px). A thin top divider defines each row; the final row also has a bottom divider. Mobile rows stack with a 12px gap and 27px vertical padding. These are static articles with no hover or click behavior.

### Development status

A static inline label on navy uses white semibold text (12px) and a small orange dot (8px). The dot does not pulse. It communicates the current project's development state; it is not a live availability indicator.

### Focus and motion

Keyboard focus is visible on links and buttons: a dark-orange outline (3px) offset by 5px. Inside the navy closing band, focus uses the warm accent. Focused buttons are raised only in stacking order to avoid outline overlap. A skip link appears on focus and leads to the main content.

For `prefers-reduced-motion: reduce`, scrolling becomes immediate and all animations and transitions are disabled. Preserve this path when extending the current components. No input fields, form validation, dialogs or data-loading states exist yet; design and document those when they are implemented.

## Do's and Don'ts

### Do:

- **Do** preserve the original user-provided logo artwork and the institutional marks.
- **Do** pair Archivo headings with Manrope reading text and controls.
- **Do** use flat surfaces, tonal bands and thin rules as the default separation.
- **Do** preserve keyboard focus, semantic selection state and reduced-motion behavior.
- **Do** describe future participation and the local demonstration truthfully in approachable Brazilian Portuguese.

### Don't:

- **Don't** replace dark action ink with white text on the bright orange action.
- **Don't** recolor the original logo to match a text token.
- **Don't** treat the static development dot as a live activity signal.
- **Don't** add participation statistics, endorsements or live events without evidence.
- **Don't** infer missing form, error, loading or disabled patterns from this landing's documentation.
