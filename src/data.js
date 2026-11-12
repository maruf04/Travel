// Mock data used when VITE_API_URL is not set. Delete once your backend is ready.
// Source: Nadir On The Go - Bangla "All videos" playlist (PLPXYB63Q-KLngx6RsJyFtjN84oW0qb1WU).
// Coordinates are approximate. Where a title names only a country, the pin sits at a
// representative point in that country, not at the exact filming location.
const watch = (id) => 'https://www.youtube.com/watch?v=' + id

export const MOCK_VLOGGERS = [
  { id: 1, name: 'Nadir On The Go - Bangla', country: 'Bangladesh' },
]

// [videoId, place, lat, lng, title]
const NADIR_ROWS = [
  // Bangladesh
  ['7JjHVuxu_ow', "Cox's Bazar, Bangladesh", 21.43, 91.98, `কক্সবাজার এ সার্ফিং?`],
  ['E2Df6iwT-SA', 'Dhaka, Bangladesh', 23.81, 90.41, `এটাই আসল ঢাকা!`],
  ['mL-g9T5dYmU', 'Sylhet, Bangladesh', 24.89, 91.87, `A spicy feast at Sylhet's Panch Bhai Restaurant with @LukeDamant 🇧🇩`],

  // Türkiye
  ['YNVe-reJ2E0', 'Istanbul, Türkiye', 41.01, 28.98, `ইস্তাম্বুল, তুরস্কে প্রথম দিন 🇹🇷`],
  ['37f88pxl8OQ', 'Topkapı, Istanbul, Türkiye', 41.0115, 28.9833, `হযরত মুহাম্মদের (সা:) তলোয়ার এখানে 🇹🇷`],
  ['iTK10zAGcco', 'Istanbul, Türkiye', 41.02, 28.97, `ইউরোপের সবচেয়ে মহান শহর - এটা ইস্তানবুলের কাহিনী  🇹🇷`],
  ['4mtq_VfQ9Rw', 'Eminönü, Istanbul, Türkiye', 41.0176, 28.9735, `ইস্তান্বুলের ভাসমান রেস্টুরেন্ট 🇹🇷`],
  ['kMRgVWgsSSs', 'Istanbul, Türkiye', 41.0082, 28.9784, `Shave with fire in Istanbul 🔥🇹🇷`],
  ['3OYvNgrljFE', 'Istanbul, Türkiye', 41.0136, 28.955, `Free Iftar in Istanbul from the Turkish government 🇹🇷`],
  ['TMgPyK32aWY', 'Cappadocia, Türkiye', 38.64, 34.83, `ক্যাপাডকিয়া এরকম হবে আশা করিনি  🇹🇷`],
  ['ShU_6QQquTI', 'Ankara, Türkiye', 39.93, 32.86, `The best kebab in the Turkish capital? 🇹🇷`],
  ['wVaU6EdtDyw', 'Izmir, Türkiye', 38.42, 27.14, `ইজমির ও তুরস্কের ঐতিহাসিক পশ্চিম উপকূল 🇹🇷`],
  ['T6PKiWYGDZo', 'Afyonkarahisar, Türkiye', 38.76, 30.54, `তুরস্কের আফিম উৎপাদনের কেন্দ্রস্থল এই শহর  🇹🇷`],
  ['VWYj-8EHGJQ', 'Eastern Türkiye', 39.9, 41.27, `Duck Pilaf in Eastern Turkey 🇹🇷`],
  ['R6MnqW2B4bQ', 'Ani, Türkiye', 40.51, 43.57, `সাম্রাজ্যের রাজধানী আজ ভুতের শহর 🇹🇷`],
  ['pJz43o90xWQ', 'Doğubayazıt, Türkiye', 39.55, 44.08, `নূহ (আঃ) এর নৌকা`],
  ['4zr-BPzHJ3U', 'Türkiye–Syria border', 36.2, 36.16, `Speaking from the Syrian border`],
  ['qqSF0-LuNF8', 'Türkiye', 38.96, 35.24, `তুরস্কের সবচেয়ে নামকরা কোফতা 🇹🇷`],
  ['DYMdW8KRERY', 'Türkiye', 39.2, 34.5, `আনাতোলিয়ার সুইজারল্যান্ড   🇹🇷`],
  ['BUI4DqP_i6Y', 'Türkiye', 38.5, 36.0, `Everything is free for Bangladeshis in this Turkish city! 🇹🇷`],

  // Balkans
  ['jI6blWly4dM', 'Niš, Serbia', 43.32, 21.9, `This tower is made of human skulls 🇷🇸`],
  ['fkt6p1F3tNo', 'Serbia', 44.02, 21.0, `ইউরোপের সবচেয়ে আন্ডাররেটেড শহর 🇷🇸`],
  ['_yJI2WRlQZ8', 'Belgrade, Serbia', 44.79, 20.46, `The Real Story Behind Europe's Most Misunderstood City - Belgrade 🇷🇸`],
  ['LJxDExHyty8', 'Sarajevo, Bosnia and Herzegovina', 43.86, 18.41, `Why is this Muslim city in Europe? 🇧🇦`],
  ['J0ATIDoqVq0', 'Montenegro coast', 42.29, 18.84, `The unknown coast of Europe - Montenegro 🇲🇪`],
  ['grAXwcmspFs', 'Podgorica, Montenegro', 42.44, 19.26, `First day in Montenegro 🇲🇪`],
  ['KerFEsc6GRU', 'Durmitor, Montenegro', 43.13, 19.03, `মন্টিনিগ্রোতে ২৫০০ মিটার উঁচু পাহাড়ে আরোহণ 🇲🇪`],
  ['0vg4W-gt3UM', 'Montenegro–Albania border', 42.4, 19.8, `পাহাড়ের মধ্য দিয়ে ইউরোপের নতুন দেশে যাত্রা 🇲🇪🇦🇱`],
  ['w8huoR-Ol_o', 'Tirana, Albania', 41.33, 19.82, `First day in Albania 🇦🇱`],
  ['UUZFwa8Obac', 'Albanian Alps, Albania', 42.4, 19.77, `Albanian Alps - 2 day trip 🇦🇱`],
  ['m9dF1l5wQDk', 'Tirana, Albania', 41.33, 19.82, `৳500 Albanian Stuffed Capsicum and Eggplant 🇦🇱`],
  ['Bn37PH4WSwE', 'Tirana, Albania', 41.33, 19.82, `How did I get to European television news? 🇦🇱`],
  ['MdC5vXJDfAA', 'Tirana, Albania', 41.33, 19.82, `৪০ বছর কেউ এদেশে ঢুকতে বা বের হতে পারেনি 🇦🇱`],
  ['h_O4LSbznnw', 'Tirana, Albania', 41.33, 19.82, `৳1000 Albanian Baked Cheese and Dolma 🇦🇱`],
  ['nuKjFI4rBNQ', 'Tirana, Albania', 41.33, 19.82, `Every Type of Byrek in Albania 🇦🇱`],
  ['OAGz18piTFY', 'Tirana, Albania', 41.33, 19.82, `230 Taka Albanian Chicken Gyros 🇦🇱`],
  ['GkV9YampJAo', 'Skopje, North Macedonia', 41.99, 21.43, `First Day in Macedonia 🇲🇰`],
  ['Yj4JMaJsUQo', 'Skopje, North Macedonia', 41.99, 21.43, `উসমানীয় বাজারে মেসিডোনিয়ার ঐতিহ্যবাহী খাবার  🇲🇰`],
  ['WWhDfdfp6Kg', 'Greece', 39.07, 21.82, `The most amazing city in ancient Greece?`],

  // Georgia
  ['dDX_DOpVhHw', 'Ushguli, Georgia', 42.92, 43.01, `ইউরোপের সর্বোচ্চ বসতি 🇬🇪`],
  ['W-jj3Zn6ps8', 'Tbilisi, Georgia', 41.72, 44.79, `৳20 Soup-filled Georgian Dumplings 🇬🇪`],
  ['5C-lv0Ms7E0', 'Tbilisi, Georgia', 41.72, 44.79, `৳ ২৫০ জর্জিয়ার চীজ-ব্রেড 🇬🇪`],

  // India
  ['RDCZlur_dwA', 'Kolkata, India', 22.57, 88.36, `Cultural capital of India - Kolkata 🇮🇳`],
  ['i4z7R27JuSI', 'Mumbai, India', 19.08, 72.88, `৳ 500 Mumbai Tour 🇮🇳`],
  ['UNTaC1oQCdw', 'Mumbai, India', 19.08, 72.88, `মুম্বাইয়ের পার্সি (ইরানি) খাবার 🇮🇳`],
  ['bfS9Qq4tyfs', 'Mumbai, India', 19.08, 72.88, `৳৬০ সুস্বাদু বোম্বাই বার্গার 🇮🇳`],
  ['neoJaDHR5Ys', 'Jodhpur, India', 26.24, 73.02, `মাথানষ্ট জায়গা যোধপুর - রাজস্থানে প্রথম দিন 🇮🇳`],

  // Sri Lanka
  ['OXeWT7TBC7Q', 'Colombo, Sri Lanka', 6.93, 79.86, `First day in Sri Lanka 🇱🇰`],
  ['seagTBPhpr4', 'Colombo, Sri Lanka', 6.93, 79.86, `In search of Sri Lanka's favorite dish - ৳ 110 kottu 🇱🇰`],
  ['Z5H_59YRGLw', 'Sri Lanka', 7.87, 80.77, `বন্য হাতি পরিবারের মুখোমুখি - শ্রীলঙ্কা 🇱🇰`],
  ['HTTSVyFue1E', 'Ella, Sri Lanka', 6.87, 81.05, `শ্রীলঙ্কার বিখ্যাত ট্রেন যাত্রা - এলা থেকে আদম পাহাড় 🇱🇰`],
  ['vlWbaV8eiyY', "Adam's Peak, Sri Lanka", 6.81, 80.5, `The First Footprint of Adam (A.S.) on Earth - Adam's Peak 🇱🇰`],
  ['fxLQoVsFiyQ', 'Sigiriya, Sri Lanka', 7.96, 80.76, `I went to see the eighth wonder of the world 🇱🇰`],

  // Nepal
  ['vkyPNpUcNMM', 'Bhaktapur, Nepal', 27.67, 85.43, `নেপালের প্রাচীন রাজধানী - ভক্তপুর  🇳🇵`],
  ['0NxtHru79OQ', 'Kathmandu, Nepal', 27.72, 85.32, `৳ ১১ কাঠমান্ডুর মোমো - নেপাল 🇳🇵`],
  ['lZnRF--puhc', 'Pashupatinath, Kathmandu, Nepal', 27.71, 85.35, `শেষকৃত্যের এক অন্যরকম অনুষ্ঠান -  কাঠমান্ডু, নেপাল 🇳🇵`],
  ['5otMyf9jgkc', 'Himalayas, Nepal', 28.6, 83.82, `4-day journey to the Himalayas 🇳🇵 - Part 1`],
  ['Sy-pc6-k3AA', 'Himalayas, Nepal', 28.62, 83.85, `হিমালয়ে ৪ দিনের যাত্রা 🇳🇵 - শেষ পর্ব`],
  ['AxeELpVm7W0', 'Nepal', 27.53, 84.35, `নেপালের মারাত্মক জঙ্গলের ভিতরে 🇳🇵`],

  // Maldives
  ['X-nh1qZOWf4', 'Malé, Maldives', 4.18, 73.51, `First day in Maldives 🇲🇻`],
  ['iJLmgLKuQgo', 'Maldives', 3.2, 73.22, `মালদ্বীপের সমুদ্রতলে স্কুবা ডাইভিং 🇲🇻`],
  ['p_RgUNFLUME', 'Malé, Maldives', 4.18, 73.51, `Adventure in the capital of the Maldives 🇲🇻`],
  ['GXPlAsdcB_Y', 'Malé, Maldives', 4.18, 73.51, `মালদ্বীপের বাজারে দেখি সবাই বাংলাদেশী 🇲🇻 🇧🇩`],

  // Philippines
  ['ZcFPCidtvT4', 'Manila, Philippines', 14.6, 120.98, `Shopping in the Slums of the Philippines - Manila 🇵🇭`],
  ['TCjgD3x4Ys4', 'Quiapo, Manila, Philippines', 14.5995, 120.9842, `Iftar in the "Muslim Town" of the Philippines 🇵🇭`],
  ['uQYYKmNGMOE', 'Makati & BGC, Philippines', 14.55, 121.05, `The most fancy cities in the Philippines - Makati and BGC 🇵🇭`],
  ['eiXOxXy-Skc', 'Siargao, Philippines', 9.85, 126.05, `The most fun island in the Philippines - Siargao 🇵🇭`],
  ['il3KxncecFE', 'Cebu, Philippines', 10.32, 123.89, `Expedition from the mountains to the waterfalls in the Philippines - Cebu 🇵🇭`],
  ['Qr5kRqnzzH0', 'Bohol, Philippines', 9.85, 124.14, `ফিলিপিনো জঙ্গলের গভীর থেকে - বোহোল 🇵🇭`],
  ['jRYk9995_V8', 'Coron, Philippines', 12.0, 120.2, `ফিলিপাইনের জাহাজ-ডুবির ভিতরে স্কুবা ডাইভিং 🇵🇭`],

  // Italy, Switzerland
  ['tNnT9rALMrw', 'Milan, Italy', 45.46, 9.19, `First day in Italy - Milan Vlog 🇮🇹`],
  ['IpPwP4RGtDg', 'Florence, Italy', 43.77, 11.26, `এক ধনী পরিবার কীভাবে ইউরোপকে ধ্বংস থেকে বাঁচালো💰- ফ্লোরেন্স 🇮🇹`],
  ['0jBtKC1_WaA', 'Venice, Italy', 45.44, 12.32, `পৃথিবীর একমাত্র ভাসমান শহরে - ভেনিস 🇮🇹`],
  ['_LWcZoOpgLM', 'Dolomites, Italy', 46.41, 11.84, `সুইজারল্যান্ড এর চেয়েও সেরা এই জায়গা! 🇮🇹🇨🇭`],
  ['_Nd2i4OpbdU', 'Zurich, Switzerland', 47.38, 8.54, `সুইজারল্যান্ডে প্রথম দিন 🇨🇭`],
  ['EdWiSu8tNgI', 'Switzerland', 46.82, 8.23, `৳ ২৯,০০০ ট্রেনে চড়ে সুইজারল্যান্ডে যাত্রা 🇨🇭`],

  // Romania, Netherlands
  ['D3u5in2h6r4', 'Bucharest, Romania', 44.43, 26.1, `রোমেনিয়ায় প্রথম দিন - বুকারেস্ট 🇷🇴`],
  ['UnKEh4FRth8', 'Transylvania, Romania', 45.65, 25.61, `রোমেনিয়ার রহস্যময় ট্র্যান্সিলভেনিয়ায় যাত্রা 🇷🇴`],
  ['Xm-1_1jgQJU', 'Bucharest, Romania', 44.43, 26.1, `এক দুর্নীতিগ্রস্ত একনায়ককে কিভাবে জনগণ জাতীয় টিভিতে মেরে ফেললো 🇷🇴`],
  ['pDM9yW7O3Kw', 'Amsterdam, Netherlands', 52.37, 4.9, `নেদারল্যান্ডসে প্রথম দিন - অ্যামস্টারডাম 🇳🇱`],

  // Thailand
  ['bRS_L1ybm4M', 'Bangkok, Thailand', 13.76, 100.5, `First day in Thailand - Bangkok is in chaos.. 🇹🇭`],
  ['4YJHaOjo0Pw', 'Chiang Mai, Thailand', 18.79, 98.98, `The best food tour in Thailand (Chiang Mai) 🇹🇭`],
  ['CbG4SqYFxaY', 'Thailand', 15.87, 100.99, `A day in the jungle of Thailand 🇹🇭`],
  ['HCrDgc3eorA', 'Thailand', 14.5, 101.5, `থাইল্যান্ডের সবচেয়ে মাথানষ্ট জায়গায়.. 🇹🇭`],
  ['m9Sw6o9I-sc', 'Thailand', 16.5, 99.5, `থাইল্যান্ডের সেরা ১০টি  জায়গা 🇹🇭`],

  // UAE
  ['f2JcblOIsW8', 'Dubai, UAE', 25.2, 55.27, `First day in Dubai 🇦🇪`],
  ['fB_5N8SpjPk', 'Abu Dhabi, UAE', 24.45, 54.38, `৳250 Abu Dhabi Arab Sharma 🇦🇪`],
  ['wuMPzpe_Zd8', 'United Arab Emirates', 23.42, 53.85, `দুবাইয়ের বাইরের আরব আমিরাত 🇦🇪`],
  ['UR_mf4iHXmE', 'Dubai, UAE', 25.2, 55.27, `Traditional Emirati Iftar in Dubai 🇦🇪`],
  ['70Yoggg_AjM', 'Dubai, UAE', 25.2, 55.27, `The surprising reality of expats in Dubai 🇦🇪`],
  ['ef2nddB380o', 'Sonapur, Dubai, UAE', 25.2, 55.4, `দুবাইয়ের সোনাপুরে ইফতার 🇦🇪`],
  ['QtlwzsNNwOc', 'Deira, Dubai, UAE', 25.27, 55.3, `সোনা, মশলা সবই দুবাইয়ের পুরান বাজারে 🇦🇪`],
  ['RC2yi34I8Yk', 'Burj Khalifa, Dubai, UAE', 25.1972, 55.2744, `At the top of the world's tallest building.. 🇦🇪`],
  ['XpbLUetjEmM', 'Dubai, UAE', 25.2, 55.27, `Only Possible in Dubai 🇦🇪`],

  // Qatar, Saudi Arabia
  ['pw9AGVE3BU4', 'Doha, Qatar', 25.29, 51.53, `সবচেয়ে ধনী আরব দেশে এক দিন 🇶🇦`],
  ['mTnY_6TTm4w', 'Doha, Qatar', 25.29, 51.53, `কাতারে প্রবাসীরা দুবাইয়ের চেয়েও কষ্টে আছে 🇶🇦`],
  ['ajrAWqQUyKQ', 'Qatar–Saudi desert', 24.65, 51.3, `A risky desert safari between Qatar and Saudi Arabia 🇶🇦`],
  ['AnmbE4CPz5s', 'Saudi Arabia', 24.71, 46.68, `সৌদি আরবে প্রথম দিন 🇸🇦`],

  // Indonesia
  ['0aVioHTtGvk', 'Indonesia', -2.5, 118.0, `এশিয়ার সবচেয়ে সুন্দর দ্বীপ 🇮🇩`],
  ['OgSDofQauKo', 'Bali, Indonesia', -8.41, 115.19, `বালি ইন্দোনেশিয়া 🇮🇩`],
  ['j1MiHzRbntU', 'Bali, Indonesia', -8.65, 115.22, `Bali, Indonesia - 10,000 Taka Budget Challenge 🇮🇩`],
  ['yzhLlprnX8Q', 'Banda Aceh, Indonesia', 5.55, 95.32, `A Day in an Indonesian City with Sharia Law 🕌🇮🇩`],
  ['e33s_4dcYJ8', 'Jakarta, Indonesia', -6.21, 106.85, `বিশ্বের সবচেয়ে বড় মুসলিম দেশে ইফতার`],
  ['YlxnEw39zoY', 'Sampela, Wakatobi, Indonesia', -5.57, 123.77, `I Spent 2 Days With an Underwater Tribe`],

  // Americas
  ['C6GV0mtTc8c', 'Guatemala', 14.63, -90.51, `চোখের সামনে আগ্নেয়গিরির বিস্ফোরণ! 🇬🇹`],
  ['TJX6H09Zkas', 'Yucatán, Mexico', 20.68, -88.57, `মেক্সিকোর পানির নিচের গুহা 🇲🇽`],
  ['AqlKbIAQdpI', 'Mexico', 19.43, -99.13, `I broke my arm in Mexico 🇲🇽`],
  ['HVABRQpX2Cc', 'Boston, USA', 42.36, -71.06, `আমেরিকায় প্রথম দিন - বস্টন 🇺🇸`],
  ['ndiHYlM8550', 'Belize', 17.25, -88.77, `1 day in the strangest country in North America 🇧🇿`],

  // Elsewhere in Asia / Africa / Europe
  ['1ihRrpVFL9o', 'Kuala Lumpur, Malaysia', 3.14, 101.69, `মালয়েশিয়া ৳১০,০০০ লাক্সারি চ্যালেঞ্জ 💵`],
  ['8cIfn7RPDys', 'Brunei', 4.89, 114.94, `In the secret kingdom of Asia where everyone is rich 🇧🇳`],
  ['apCq1yvR5OQ', 'Nairobi, Kenya', -1.29, 36.82, `24 hours in the life of a travel vlogger – Kenya`],
  ['wi0gmRWfU4I', 'Laos', 18.5, 103.5, `How US military operations destroyed this Asian country`],
  ['mSK7xdSrQ6Y', 'Vientiane, Laos', 17.97, 102.63, `The most underrated country in Asia - Laos`],
  ['_p0jg9gRADA', 'Belfast, Northern Ireland', 54.6, -5.93, `In Europe's Most Divided City 🇮🇱🇵🇸🇮🇪🇬🇧`],
]

// Every row gets a country (taken from the end of `place`, with a few special cases).
const COUNTRY_OVERRIDES = {
  'Eastern Türkiye': 'Türkiye',
  'Türkiye–Syria border': 'Türkiye',
  'Türkiye': 'Türkiye',
  'Montenegro coast': 'Montenegro',
  'Montenegro–Albania border': 'Montenegro',
  'Qatar–Saudi desert': 'Qatar',
  'United Arab Emirates': 'UAE',
}
const countryOf = (place) =>
  COUNTRY_OVERRIDES[place] || place.split(', ').pop()

// Flat list: one entry per video (same shape as before, plus `country`).
export const MOCK_STOPS = {
  1: NADIR_ROWS.map(([vid, place, lat, lng, title], i) => ({
    id: i + 11,
    place,
    country: countryOf(place),
    lat,
    lng,
    title,
    url: watch(vid),
  })),
}

// Group flat stops into countries -> cities -> videos.
// Countries with fewer than `minVideos` videos are returned with `cluster: false`,
// meaning the map should show their city markers directly instead of a country marker.
export function groupByCountry(stops, minVideos = 4) {
  const countries = new Map()
  for (const s of stops) {
    if (!countries.has(s.country)) countries.set(s.country, { country: s.country, cities: new Map(), videos: 0 })
    const c = countries.get(s.country)
    c.videos += 1
    const key = s.place
    if (!c.cities.has(key)) c.cities.set(key, { place: s.place, lat: s.lat, lng: s.lng, videos: [] })
    c.cities.get(key).videos.push({ id: s.id, title: s.title, url: s.url })
  }
  return [...countries.values()].map((c) => {
    const cities = [...c.cities.values()]
    return {
      country: c.country,
      videos: c.videos,
      cities,
      // country marker sits at the average position of its cities
      lat: cities.reduce((a, x) => a + x.lat, 0) / cities.length,
      lng: cities.reduce((a, x) => a + x.lng, 0) / cities.length,
      cluster: c.videos >= minVideos,
    }
  })
}