// Emoji choices for topic icons. Each item is [emoji, search words].
// Add more lines any time; the picker shows them automatically.
export const EMOJI_GROUPS = [
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
]
