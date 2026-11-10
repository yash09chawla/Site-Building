/** English country names for the international-case form.
 *
 *  Passport question 620 sends `Name (alpha-3)`, the example in the form
 *  contract being `India (IND)`. Education and employment question 98 send
 *  the English name alone. Both are the option text, so this list is the
 *  master: the backend stores these strings, not the alpha-2 code. */

export type IsoCountry = { name: string; a2: string; a3: string };

const LINES = `
Afghanistan|AF|AFG
Albania|AL|ALB
Algeria|DZ|DZA
Andorra|AD|AND
Angola|AO|AGO
Antigua and Barbuda|AG|ATG
Argentina|AR|ARG
Armenia|AM|ARM
Australia|AU|AUS
Austria|AT|AUT
Azerbaijan|AZ|AZE
Bahamas|BS|BHS
Bahrain|BH|BHR
Bangladesh|BD|BGD
Barbados|BB|BRB
Belarus|BY|BLR
Belgium|BE|BEL
Belize|BZ|BLZ
Benin|BJ|BEN
Bhutan|BT|BTN
Bolivia|BO|BOL
Bosnia and Herzegovina|BA|BIH
Botswana|BW|BWA
Brazil|BR|BRA
Brunei|BN|BRN
Bulgaria|BG|BGR
Burkina Faso|BF|BFA
Burundi|BI|BDI
Cabo Verde|CV|CPV
Cambodia|KH|KHM
Cameroon|CM|CMR
Canada|CA|CAN
Central African Republic|CF|CAF
Chad|TD|TCD
Chile|CL|CHL
China|CN|CHN
Colombia|CO|COL
Comoros|KM|COM
Congo|CG|COG
Costa Rica|CR|CRI
Côte d'Ivoire|CI|CIV
Croatia|HR|HRV
Cuba|CU|CUB
Cyprus|CY|CYP
Czechia|CZ|CZE
Democratic Republic of the Congo|CD|COD
Denmark|DK|DNK
Djibouti|DJ|DJI
Dominica|DM|DMA
Dominican Republic|DO|DOM
Ecuador|EC|ECU
Egypt|EG|EGY
El Salvador|SV|SLV
Equatorial Guinea|GQ|GNQ
Eritrea|ER|ERI
Estonia|EE|EST
Eswatini|SZ|SWZ
Ethiopia|ET|ETH
Fiji|FJ|FJI
Finland|FI|FIN
France|FR|FRA
Gabon|GA|GAB
Gambia|GM|GMB
Georgia|GE|GEO
Germany|DE|DEU
Ghana|GH|GHA
Greece|GR|GRC
Grenada|GD|GRD
Guatemala|GT|GTM
Guinea|GN|GIN
Guinea-Bissau|GW|GNB
Guyana|GY|GUY
Haiti|HT|HTI
Honduras|HN|HND
Hong Kong|HK|HKG
Hungary|HU|HUN
Iceland|IS|ISL
India|IN|IND
Indonesia|ID|IDN
Iran|IR|IRN
Iraq|IQ|IRQ
Ireland|IE|IRL
Israel|IL|ISR
Italy|IT|ITA
Jamaica|JM|JAM
Japan|JP|JPN
Jordan|JO|JOR
Kazakhstan|KZ|KAZ
Kenya|KE|KEN
Kiribati|KI|KIR
Kosovo|XK|XKX
Kuwait|KW|KWT
Kyrgyzstan|KG|KGZ
Laos|LA|LAO
Latvia|LV|LVA
Lebanon|LB|LBN
Lesotho|LS|LSO
Liberia|LR|LBR
Libya|LY|LBY
Liechtenstein|LI|LIE
Lithuania|LT|LTU
Luxembourg|LU|LUX
Macao|MO|MAC
Madagascar|MG|MDG
Malawi|MW|MWI
Malaysia|MY|MYS
Maldives|MV|MDV
Mali|ML|MLI
Malta|MT|MLT
Marshall Islands|MH|MHL
Mauritania|MR|MRT
Mauritius|MU|MUS
Mexico|MX|MEX
Micronesia|FM|FSM
Moldova|MD|MDA
Monaco|MC|MCO
Mongolia|MN|MNG
Montenegro|ME|MNE
Morocco|MA|MAR
Mozambique|MZ|MOZ
Myanmar|MM|MMR
Namibia|NA|NAM
Nauru|NR|NRU
Nepal|NP|NPL
Netherlands|NL|NLD
New Zealand|NZ|NZL
Nicaragua|NI|NIC
Niger|NE|NER
Nigeria|NG|NGA
North Korea|KP|PRK
North Macedonia|MK|MKD
Norway|NO|NOR
Oman|OM|OMN
Pakistan|PK|PAK
Palau|PW|PLW
Palestine|PS|PSE
Panama|PA|PAN
Papua New Guinea|PG|PNG
Paraguay|PY|PRY
Peru|PE|PER
Philippines|PH|PHL
Poland|PL|POL
Portugal|PT|PRT
Qatar|QA|QAT
Romania|RO|ROU
Russia|RU|RUS
Rwanda|RW|RWA
Saint Kitts and Nevis|KN|KNA
Saint Lucia|LC|LCA
Saint Vincent and the Grenadines|VC|VCT
Samoa|WS|WSM
San Marino|SM|SMR
Sao Tome and Principe|ST|STP
Saudi Arabia|SA|SAU
Senegal|SN|SEN
Serbia|RS|SRB
Seychelles|SC|SYC
Sierra Leone|SL|SLE
Singapore|SG|SGP
Slovakia|SK|SVK
Slovenia|SI|SVN
Solomon Islands|SB|SLB
Somalia|SO|SOM
South Africa|ZA|ZAF
South Korea|KR|KOR
South Sudan|SS|SSD
Spain|ES|ESP
Sri Lanka|LK|LKA
Sudan|SD|SDN
Suriname|SR|SUR
Sweden|SE|SWE
Switzerland|CH|CHE
Syria|SY|SYR
Taiwan|TW|TWN
Tajikistan|TJ|TJK
Tanzania|TZ|TZA
Thailand|TH|THA
Timor-Leste|TL|TLS
Togo|TG|TGO
Tonga|TO|TON
Trinidad and Tobago|TT|TTO
Tunisia|TN|TUN
Turkey|TR|TUR
Turkmenistan|TM|TKM
Tuvalu|TV|TUV
Uganda|UG|UGA
Ukraine|UA|UKR
United Arab Emirates|AE|ARE
United Kingdom|GB|GBR
United States|US|USA
Uruguay|UY|URY
Uzbekistan|UZ|UZB
Vanuatu|VU|VUT
Vatican City|VA|VAT
Venezuela|VE|VEN
Vietnam|VN|VNM
Yemen|YE|YEM
Zambia|ZM|ZMB
Zimbabwe|ZW|ZWE
`;

function parse(source: string): IsoCountry[] {
  const out: IsoCountry[] = [];
  const a2s = new Set<string>();
  const a3s = new Set<string>();
  for (const line of source.trim().split("\n")) {
    const [name, a2, a3] = line.split("|");
    if (!name || a2?.length !== 2 || a3?.length !== 3) throw new Error(`Bad country line: ${line}`);
    if (a2s.has(a2) || a3s.has(a3)) throw new Error(`Duplicate country code: ${line}`);
    a2s.add(a2);
    a3s.add(a3);
    out.push({ name, a2, a3 });
  }
  out.sort((a, b) => a.name.localeCompare(b.name, "en"));
  return out;
}

export const ISO_COUNTRIES: readonly IsoCountry[] = parse(LINES);

export type CountryFormat = "name" | "nameCode";

/** `nameCode` is passport question 620 (`India (IND)`). `name` is question 98. */
export function countryLabel(country: IsoCountry, format: CountryFormat): string {
  return format === "nameCode" ? `${country.name} (${country.a3})` : country.name;
}

export function countryOptions(format: CountryFormat): readonly string[] {
  return ISO_COUNTRIES.map((c) => countryLabel(c, format));
}
