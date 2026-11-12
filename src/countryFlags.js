// Country name -> ISO code, used to load flag images from flagcdn.com.
// Add a line here if you add a vlog from a new country; unknown countries
// fall back to a plain orange dot.
const CODES = {
  Bangladesh: 'bd', 'Türkiye': 'tr', Serbia: 'rs', 'Bosnia and Herzegovina': 'ba',
  Montenegro: 'me', Albania: 'al', 'North Macedonia': 'mk', Greece: 'gr', Georgia: 'ge',
  India: 'in', 'Sri Lanka': 'lk', Nepal: 'np', Maldives: 'mv', Philippines: 'ph',
  Italy: 'it', Switzerland: 'ch', Romania: 'ro', Netherlands: 'nl', Thailand: 'th',
  UAE: 'ae', Qatar: 'qa', 'Saudi Arabia': 'sa', Indonesia: 'id', Guatemala: 'gt',
  Mexico: 'mx', USA: 'us', Belize: 'bz', Malaysia: 'my', Brunei: 'bn', Kenya: 'ke',
  Laos: 'la', 'Northern Ireland': 'gb-nir',
}

export const flagUrl = (country) =>
  CODES[country] ? `https://flagcdn.com/w80/${CODES[country]}.png` : null
