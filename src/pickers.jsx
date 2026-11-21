// Pickers: the pop-up colour and emoji choosers used on the edit page.
//   1. ColorPicker   palette plus a box for any #hex colour
//   2. Emoji list    the emojis offered in the emoji picker (add more lines any time)
//   3. EmojiPicker   searchable emoji list

import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { usePopover } from './hooks'

// ────────────────────────────────────────────────────────────────────────────
// 1. ColorPicker   (was src/ColorPicker.jsx)
// ────────────────────────────────────────────────────────────────────────────

const COLOR_SIZE = { w: 280, h: 300 }

const PALETTE = [
  '#ff7a50', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  '#a16207', '#15803d', '#1d4ed8', '#be123c', '#64748b', '#78716c',
]

const HEX = /^#?([0-9a-f]{6})$/i

// A button that shows the chosen colour; clicking it opens a palette (plus a box for any #hex colour).
//   <ColorPicker value={color} onChange={setColor} />
// Same behaviour as the emoji picker: on top of the page, never cut off, closes when you click elsewhere.
export function ColorPicker({ value, onChange }) {
  const { open, setOpen, pos, btnRef, panelRef } = usePopover(COLOR_SIZE)
  const [hex, setHex] = useState(value)

  function pick(c) {
    onChange(c)
    setOpen(false)
  }

  function onHex(text) {
    setHex(text)
    const m = HEX.exec(text.trim())
    if (m) onChange('#' + m[1].toLowerCase()) // applies as soon as it is a complete colour
  }

  const valid = HEX.test(hex.trim())

  return (
    <div className="emoji">
      <button
        ref={btnRef}
        type="button"
        className="emoji-btn"
        onClick={() => {
          setHex(value)
          setOpen(!open)
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Choose a colour"
        title="Choose a colour"
      >
        <span className="color-dot" style={{ background: value }} />
        <small>▾</small>
      </button>

      {open && pos &&
        createPortal(
          <div ref={panelRef} className="emoji-panel color-panel" role="dialog" aria-label="Choose a colour" style={pos}>
            <p className="emoji-title">Pick a colour</p>
            <div className="color-grid">
              {PALETTE.map((c) => (
                <button key={c} type="button" className={c === value.toLowerCase() ? 'color-swatch on' : 'color-swatch'} style={{ background: c }} aria-label={c} title={c} onClick={() => pick(c)} />
              ))}
            </div>
            <label className="color-hex">
              <span className="color-dot" style={{ background: valid ? '#' + HEX.exec(hex.trim())[1] : value }} />
              <input
                value={hex}
                onChange={(e) => onHex(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), valid && setOpen(false))}
                placeholder="#4ba3f0"
                maxLength={7}
                spellCheck={false}
                aria-label="Colour code"
                aria-invalid={!valid}
              />
            </label>
            <p className="color-hint">{valid ? 'Looks good. Click outside to finish.' : 'Type a 6-digit colour code like #4ba3f0.'}</p>
          </div>,
          document.body
        )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// 2. Emoji list   (was src/emojis.js)
// ────────────────────────────────────────────────────────────────────────────

// Emoji choices for topic icons. Each item is [emoji, search words].
// Add more lines any time; the picker shows them automatically.
const EMOJI_GROUPS = [
  {
    id: 'places', label: '✈️', title: 'Travel & places',
    items: [
      ['✈️', 'airplane plane flight travel'], ['🌍', 'earth globe africa europe world'], ['🌎', 'earth globe americas world'],
      ['🌏', 'earth globe asia australia world'], ['🗺️', 'map world atlas'], ['🧭', 'compass navigation explore'],
      ['🏝️', 'island beach tropical'], ['🏖️', 'beach sea sand'], ['🏔️', 'mountain snow peak'], ['⛰️', 'mountain hill'],
      ['🌋', 'volcano eruption'], ['🏜️', 'desert sand'], ['🏞️', 'national park nature landscape'], ['🏕️', 'camping tent'],
      ['🌅', 'sunrise sunset'], ['🌄', 'sunrise mountains'], ['🌆', 'city dusk evening'], ['🏙️', 'city skyline buildings'],
      ['🌉', 'bridge night'], ['🗼', 'tower tokyo paris'], ['🗽', 'statue liberty new york'], ['🏰', 'castle europe medieval'],
      ['🏯', 'japanese castle'], ['🕌', 'mosque islam'], ['🕍', 'synagogue jewish'], ['⛪', 'church christian'],
      ['🛕', 'hindu temple'], ['🕋', 'kaaba mecca hajj'], ['⛩️', 'shrine japan torii'], ['🏛️', 'classical building history government greece'],
      ['🏟️', 'stadium arena'], ['🚆', 'train railway'], ['🚢', 'ship cruise boat'], ['⛵', 'sailboat sailing'],
      ['🚗', 'car road trip drive'], ['🚌', 'bus'], ['🚁', 'helicopter'], ['🚀', 'rocket space launch'],
      ['🛫', 'takeoff departure airport'], ['🧳', 'luggage suitcase'], ['🎒', 'backpack hiking'], ['📍', 'pin location place'],
    ],
  },
  {
    id: 'nature', label: '🌳', title: 'Nature & animals',
    items: [
      ['🌳', 'tree forest'], ['🌲', 'evergreen pine forest'], ['🌴', 'palm tree tropical'], ['🌵', 'cactus desert'],
      ['🌿', 'herb plant leaf'], ['🍀', 'clover luck'], ['🌸', 'cherry blossom flower spring'], ['🌺', 'hibiscus flower'],
      ['🌻', 'sunflower'], ['🍁', 'maple leaf autumn fall canada'], ['🌊', 'wave ocean sea water'], ['💧', 'water drop'],
      ['🔥', 'fire flame hot'], ['⛈️', 'storm thunder rain'], ['🌈', 'rainbow'], ['❄️', 'snowflake winter cold'],
      ['☀️', 'sun sunny'], ['🌙', 'moon night'], ['⭐', 'star'], ['🌌', 'galaxy milky way space'],
      ['🐘', 'elephant'], ['🦁', 'lion safari'], ['🐅', 'tiger'], ['🦅', 'eagle bird'],
      ['🐪', 'camel desert'], ['🐋', 'whale ocean'], ['🐠', 'fish tropical reef'], ['🦜', 'parrot bird'],
      ['🐢', 'turtle'], ['🦋', 'butterfly'],
    ],
  },
  {
    id: 'food', label: '🍜', title: 'Food & drink',
    items: [
      ['🍜', 'noodles ramen soup'], ['🍕', 'pizza italy'], ['🍔', 'burger'], ['🍣', 'sushi japan'],
      ['🍛', 'curry rice'], ['🥘', 'stew pot paella'], ['🌮', 'taco mexico'], ['🥙', 'kebab wrap shawarma'],
      ['🍞', 'bread'], ['🧀', 'cheese'], ['🍎', 'apple fruit'], ['🍌', 'banana'],
      ['🍇', 'grapes wine'], ['☕', 'coffee cafe'], ['🍵', 'tea'], ['🍰', 'cake dessert'],
      ['🍫', 'chocolate'], ['🌶️', 'chili spicy pepper'], ['🥭', 'mango'], ['🍚', 'rice'],
    ],
  },
  {
    id: 'culture', label: '🎭', title: 'Culture & people',
    items: [
      ['🎭', 'theatre drama culture masks'], ['🎨', 'art palette painting'], ['🎵', 'music note song'], ['🎸', 'guitar music'],
      ['🥁', 'drum music'], ['🎬', 'film movie cinema'], ['📚', 'books library study'], ['📖', 'open book reading'],
      ['🖋️', 'pen writing author'], ['🗣️', 'speaking language talk'], ['👑', 'crown king queen monarchy'], ['🏺', 'amphora vase ancient pottery'],
      ['⚔️', 'swords war battle'], ['🛡️', 'shield defense'], ['🗿', 'moai statue easter island'], ['🪔', 'diya lamp festival diwali'],
      ['🎉', 'party celebration festival'], ['🎎', 'dolls festival japan'], ['🧕', 'headscarf hijab'], ['👘', 'kimono japan clothing'],
      ['🤝', 'handshake deal agreement'], ['🕊️', 'dove peace'], ['🕯️', 'candle memory remembrance'],
    ],
  },
  {
    id: 'science', label: '💡', title: 'Science, tech & economy',
    items: [
      ['💡', 'idea light bulb invention'], ['⚙️', 'gear engineering machine'], ['🔬', 'microscope science'], ['🔭', 'telescope astronomy'],
      ['🧪', 'test tube chemistry'], ['🧬', 'dna biology genetics'], ['⚛️', 'atom physics'], ['🛰️', 'satellite space'],
      ['💻', 'laptop computer'], ['📱', 'phone mobile'], ['🔋', 'battery energy'], ['🔌', 'plug electricity'],
      ['🏭', 'factory industry'], ['🏗️', 'construction building crane'], ['⚒️', 'hammer pick tools'], ['🛠️', 'tools repair'],
      ['🧲', 'magnet'], ['💰', 'money wealth'], ['📈', 'chart growth economy'], ['🏦', 'bank finance'],
      ['🪙', 'coin currency'], ['📡', 'antenna broadcast signal'], ['🚜', 'tractor farming agriculture'], ['🩺', 'stethoscope health medicine'],
    ],
  },
  {
    id: 'world', label: '🌐', title: 'World affairs & symbols',
    items: [
      ['🌐', 'globe meridians internet geopolitics world'], ['🏳️', 'white flag surrender'], ['🚩', 'flag red'], ['🗳️', 'ballot vote election'],
      ['⚖️', 'scales law justice'], ['🔱', 'trident'], ['🧱', 'wall brick border'], ['🪖', 'helmet military soldier'],
      ['💣', 'bomb conflict'], ['☮️', 'peace'], ['🛢️', 'oil barrel energy'], ['📰', 'newspaper news'],
      ['🎙️', 'microphone podcast interview'], ['📢', 'megaphone announcement'], ['🔎', 'magnifier investigate search'], ['❓', 'question mystery'],
      ['❗', 'exclamation important'], ['💬', 'speech talk chat'], ['❤️', 'heart love'], ['✨', 'sparkles magic new'],
      ['🏆', 'trophy winner'], ['📌', 'pushpin pin'], ['🔖', 'bookmark'], ['🎯', 'target goal'], ['🧩', 'puzzle'],
    ],
  },
  {
    id: 'activities', label: '⚽', title: 'Sports & activities',
    items: [
      ['⚽', 'soccer football'], ['🏏', 'cricket bat'], ['🏀', 'basketball'], ['🎮', 'video game gaming'],
      ['🧗', 'climbing'], ['🏄', 'surfing'], ['🤿', 'diving scuba snorkel'], ['🚴', 'cycling bike'],
      ['🥾', 'hiking boot trek'], ['⛷️', 'skiing snow'], ['🏊', 'swimming'], ['🛶', 'canoe kayak'],
    ],
  },
  {
    id: 'contributors', label: '🤖', title: 'Human & animal',
    items: [
      ['🧑', 'person adult neutral avatar'], ['👨', 'man male avatar'], ['👩', 'woman female avatar'],
      ['🧔', 'beard person avatar'], ['👱', 'blonde person avatar'], ['👴', 'older man senior avatar'],
      ['👵', 'older woman senior avatar'], ['🧑‍💻', 'developer coder tech creator'], ['🧑‍🎨', 'artist painter creator'],
      ['🧑‍🔬', 'scientist researcher'], ['🧑‍🏫', 'teacher educator'], ['🧑‍🚀', 'astronaut space explorer'],
      ['🧙', 'wizard mage fantasy'], ['🥷', 'ninja stealth'], ['🦸', 'superhero hero'],
      ['👽', 'alien extraterrestrial'], ['🤖', 'robot bot ai'], ['👻', 'ghost spirit'],
      ['🎃', 'pumpkin halloween'], ['🦊', 'fox clever'], ['🐼', 'panda bear'],
      ['🐨', 'koala'], ['🐸', 'frog'], ['🦉', 'owl'],
      ['🐧', 'penguin'], ['🐺', 'wolf'], ['🦄', 'unicorn magic'],
      ['🐲', 'dragon'], ['🐶', 'dog puppy pet'], ['🐱', 'cat kitten pet'],
    ]
  },
]

// ────────────────────────────────────────────────────────────────────────────
// 3. EmojiPicker   (was src/EmojiPicker.jsx)
// ────────────────────────────────────────────────────────────────────────────

const EMOJI_SIZE = { w: 380, h: 360 }

// A button that shows the chosen emoji; clicking it opens a searchable list of emojis.
//   <EmojiPicker value={icon} onChange={setIcon} />
// The list is drawn on top of the page (so no card can cut it off), stays inside the page
// container and the screen, and closes when you click anywhere else, press Esc, or pick an emoji.
export function EmojiPicker({ value, onChange }) {
  const { open, setOpen, pos, btnRef, panelRef } = usePopover(EMOJI_SIZE)
  const [group, setGroup] = useState(EMOJI_GROUPS[0].id)
  const [q, setQ] = useState('')

  const query = q.trim().toLowerCase()
  const current = EMOJI_GROUPS.find((g) => g.id === group) || EMOJI_GROUPS[0]
  // searching matches an emoji's own words, or the name of its group (so "food" finds the whole Food & drink group)
  const items = useMemo(() => {
    if (!query) return current.items
    return EMOJI_GROUPS.flatMap((g) =>
      g.items.filter(([e, words]) => words.includes(query) || g.title.toLowerCase().includes(query) || e === q.trim())
    )
  }, [query, q, current])

  function pick(e) {
    onChange(e)
    setOpen(false)
    setQ('')
  }

  // don't pop the on-screen keyboard open on phones
  const canAutoFocus = typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches

  return (
    <div className="emoji">
      <button
        ref={btnRef}
        type="button"
        className="emoji-btn"
        onClick={() => {
          setOpen(!open)
          setQ('') // always start with an empty search
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Choose an emoji"
        title="Choose an emoji"
      >
        <span>{value || '📌'}</span>
        <small>▾</small>
      </button>

      {open && pos &&
        createPortal(
          <div ref={panelRef} className="emoji-panel" role="dialog" aria-label="Choose an emoji" style={pos}>
            <input
              placeholder="Search (e.g. food, mountain) or paste your own"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              autoFocus={canAutoFocus}
            />
            {!query && (
              <div className="emoji-tabs" role="tablist">
                {EMOJI_GROUPS.map((g) => (
                  <button key={g.id} type="button" role="tab" aria-selected={g.id === group} title={g.title} className={g.id === group ? 'on' : ''} onClick={() => setGroup(g.id)}>
                    {g.label}
                  </button>
                ))}
              </div>
            )}
            <p className="emoji-title">{query ? `Results for “${q.trim()}”` : current.title}</p>
            <div className="emoji-grid">
              {items.map(([e, words]) => (
                <button key={e} type="button" className={e === value ? 'emoji-cell on' : 'emoji-cell'} title={words.split(' ')[0]} aria-label={words.split(' ')[0]} onClick={() => pick(e)}>
                  {e}
                </button>
              ))}
            </div>
            {query && items.length === 0 && q.trim().length <= 8 && (
              <button type="button" className="a-btn" onClick={() => pick(q.trim())}>Use “{q.trim()}” as the icon</button>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}
