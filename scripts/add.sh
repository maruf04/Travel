#!/usr/bin/env bash
# Interactive data entry: asks for a video or playlist, its topic, and what that topic needs,
# shows a preview, then saves it. Repeats until you're done, then offers to commit and push.
#
#   npm run entry        (or: bash scripts/add.sh)
#
# Country names are typed in plain words ("bangladesh, pakistan"); they're turned into
# codes for you by scripts/country-code.mjs. Typos and Bangla names are fine.

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

bold=$'\e[1m'; dim=$'\e[2m'; green=$'\e[32m'; yellow=$'\e[33m'; red=$'\e[31m'; reset=$'\e[0m'
say()  { printf '%s\n' "$*"; }
warn() { printf '%s%s%s\n' "$yellow" "$*" "$reset"; }
fail() { printf '%s%s%s\n' "$red" "$*" "$reset"; }

# ask "Question" [default]  -> answer in $REPLY
ask() {
  local hint=""
  [ -n "${2:-}" ] && hint=" ${dim}[$2]${reset}"
  read -r -e -p "${bold}$1${reset}${hint}: " REPLY || exit 0   # Ctrl+D quits
  REPLY="${REPLY:-${2:-}}"
}
# yes_no "Question" Y|N  -> returns 0 for yes
yes_no() {
  local def="$2" hint="y/N"
  [ "$def" = "Y" ] && hint="Y/n"
  read -r -p "${bold}$1${reset} ${dim}[$hint]${reset}: " REPLY || exit 0
  REPLY="${REPLY:-$def}"
  [[ "$REPLY" =~ ^[Yy] ]]
}

# ---------- answers that get checked ----------

# YouTube link -> canonical URL in $URL, for kind "video" or "playlist"
read_url() {
  local kind="$1" id
  while true; do
    ask "Paste the $kind link"
    local link="$REPLY"
    if [ "$kind" = "playlist" ]; then
      id=$(sed -nE 's/.*[?&]list=([A-Za-z0-9_-]+).*/\1/p' <<<"$link")
      [ -z "$id" ] && [[ "$link" =~ ^(PL|UU|OL|FL)[A-Za-z0-9_-]{10,}$ ]] && id="$link"
      if [ -n "$id" ]; then URL="https://www.youtube.com/playlist?list=$id"; return; fi
      fail "That link has no playlist in it (it needs \"list=...\"). Try again."
    else
      id=$(sed -nE 's/.*[?&]v=([A-Za-z0-9_-]{11}).*/\1/p; s#.*youtu\.be/([A-Za-z0-9_-]{11}).*#\1#p; s#.*/(shorts|live)/([A-Za-z0-9_-]{11}).*#\2#p' <<<"$link" | head -1)
      [ -z "$id" ] && [[ "$link" =~ ^[A-Za-z0-9_-]{11}$ ]] && id="$link"
      if [ -n "$id" ]; then URL="https://www.youtube.com/watch?v=$id"; return; fi
      fail "That doesn't look like a YouTube video link. Try again."
    fi
  done
}

# country names -> codes in $CODES ("" if left blank and blank is allowed)
read_countries() {
  local question="$1" allow_blank="$2"
  while true; do
    ask "$question"
    if [ -z "$REPLY" ]; then
      [ "$allow_blank" = "yes" ] && { CODES=""; return; }
      fail "Please type at least one country."; continue
    fi
    if CODES=$(node scripts/country-code.mjs "$REPLY"); then
      yes_no "  Is that right?" Y && return
    else
      warn "  Type the names again (separate several with commas)."
    fi
  done
}

# year or period -> importer format in $ERA ("" if blank)
#   1971 | 1947-1971 | 1947 to 1971 | 500BC-300BC | 500 BC
read_era() {
  while true; do
    ask "$1"
    local e="${REPLY// /}"
    e="${e^^}"
    if [ -z "$e" ]; then ERA=""; return; fi
    e="${e//TO/-}"; e="${e//–/-}"; e="${e//BCE/BC}"; e="${e//AD/}"; e="${e//CE/}"
    if [[ "$e" =~ ^([0-9]{1,4}(BC)?)(-([0-9]{1,4}(BC)?))?$ ]]; then
      ERA="${BASH_REMATCH[1]}"
      [ -n "${BASH_REMATCH[4]}" ] && ERA="$ERA:${BASH_REMATCH[4]}"
      return
    fi
    fail "Write a year (1971), a period (1947-1971) or BC years (500BC-300BC). Leave empty to skip."
  done
}

# ---------- one entry ----------

categories=$(node -e 'for (const c of require("./public/data/categories.json")) console.log(`${c.id}\t${c.icon} ${c.name}`)')
mapfile -t cat_lines <<<"$categories"

add_one() {
  say ""
  say "${bold}── New entry ──${reset}"
  local kind
  while true; do
    ask "1) single video   2) playlist" 2
    case "$REPLY" in 1|v*|V*) kind=video; break ;; 2|p*|P*) kind=playlist; break ;; esac
    fail "Type 1 or 2."
  done
  read_url "$kind"

  say ""
  local i=1 line
  for line in "${cat_lines[@]}"; do say "  $i) ${line#*$'\t'}"; i=$((i + 1)); done
  local category
  while true; do
    ask "Topic number"
    if [[ "$REPLY" =~ ^[0-9]+$ ]] && [ "$REPLY" -ge 1 ] && [ "$REPLY" -le "${#cat_lines[@]}" ]; then
      category="${cat_lines[$((REPLY - 1))]%%$'\t'*}"; break
    fi
    fail "Type a number from the list."
  done

  # what each topic needs
  CODES=""; ERA=""
  local many="these videos"; [ "$kind" = video ] && many="this video"
  case "$category" in
    travel)
      read_countries "Which country is $many in? ${dim}(empty = find it in each title)${reset}" yes
      ;;
    history)
      read_countries "Which country's history? ${dim}(e.g. bangladesh; empty = find it in each title)${reset}" yes
      read_era "Year or period ${dim}(1971, 1947-1971, 500BC-300BC; empty if unknown or different per video)${reset}"
      ;;
    geopolitics)
      read_countries "Which countries are involved? ${dim}(e.g. india, pakistan; empty = find them in each title)${reset}" yes
      read_era "Year or period, if it's about a specific time ${dim}(empty = present day)${reset}"
      ;;
    invention)
      if yes_no "Is $many about the whole world rather than one country?" Y; then
        CODES="EARTH"
      else
        read_countries "Which country? ${dim}(where it was invented)${reset}" no
      fi
      read_era "Year or period of the invention ${dim}(empty if unknown or different per video)${reset}"
      ;;
    culture)
      read_countries "Which country's culture? ${dim}(empty = find it in each title)${reset}" yes
      ;;
    *)
      read_countries "Which countries? ${dim}(empty = find them in each title)${reset}" yes
      read_era "Year or period ${dim}(empty to skip)${reset}"
      ;;
  esac

  local args=("$URL" --category "$category")
  [ -n "$CODES" ] && args+=(--countries "$CODES")
  [ -n "$ERA" ] && args+=("--era=$ERA")
  if [ -n "${ANTHROPIC_API_KEY:-}" ] && yes_no "Let Claude fill in countries, years and places from the descriptions? (costs a little)" N; then
    args+=(--ai)
  fi

  say ""
  say "${dim}Fetching from YouTube and checking…${reset}"
  local preview
  if ! preview=$(node scripts/add-videos.mjs "${args[@]}" --dry-run 2>&1); then
    say "$preview"; fail "Something went wrong (see above). Nothing was saved."; return
  fi
  say "$preview" | grep -v '^Dry run'

  # "3 new, 2 existing videos also tagged ..." -> something to save if either number isn't 0
  local new retag
  new=$(sed -nE 's/^([0-9]+) new, .*/\1/p' <<<"$preview")
  retag=$(sed -nE 's/^[0-9]+ new, ([0-9]+) existing .*/\1/p' <<<"$preview")
  if [ "${new:-0}" -eq 0 ] && [ "${retag:-0}" -eq 0 ]; then
    warn "Nothing new to add: these videos are already on the site with this topic."; return
  fi
  [ "${new:-0}" -eq 0 ] && say "These videos are already on the site; saving adds the \"$category\" topic to them."

  # a channel we haven't seen before: ask where it's from (shown as its flag on the site)
  if grep -q '^New channel: .*add --channel-country' <<<"$preview"; then
    local name
    name=$(sed -nE 's/^New channel: (.*)  \(add --channel-country.*/\1/p' <<<"$preview" | head -1)
    read_countries "\"$name\" is a new channel. Which country is it from? ${dim}(empty to skip)${reset}" yes
    [ -n "$CODES" ] && [ "$CODES" != "EARTH" ] && args+=(--channel-country "${CODES%%,*}")
  fi

  if yes_no "Save these?" Y; then
    # second run writes the files (the preview above didn't)
    if node scripts/add-videos.mjs "${args[@]}" 2>&1 | grep -E 'new,|Saved|have no country'; then
      SAVED=$((SAVED + 1))
      say "${green}Saved.${reset}"
    else
      fail "Saving failed. Nothing was written."
    fi
  else
    say "Skipped."
  fi
}

# ---------- main loop ----------

SAVED=0
say "${bold}Add videos to the map${reset} ${dim}(Ctrl+C to quit at any time)${reset}"
while true; do
  add_one
  say ""
  yes_no "Add another video or playlist?" Y || break
done

if [ "$SAVED" -gt 0 ] && ! git diff --quiet -- public/data; then
  say ""
  git --no-pager diff --stat -- public/data
  if yes_no "Commit and push so it goes live?" N; then
    ask "Commit message" "Add videos"
    git add public/data && git commit -q -m "$REPLY" && say "${green}Committed.${reset}" && git push && say "${green}Pushed. The site updates in a minute or two.${reset}"
  else
    say "Not committed. When ready: git add public/data && git commit -m \"Add videos\" && git push"
  fi
fi
