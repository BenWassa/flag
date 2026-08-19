import type { Country } from '../domain/models.js';
import { REGIONS } from './continents.js';

const ROWS = `
DZA|DZ|Algeria|north-africa
EGY|EG|Egypt|north-africa
LBY|LY|Libya|north-africa
MAR|MA|Morocco|north-africa
SDN|SD|Sudan|north-africa
TUN|TN|Tunisia|north-africa
BEN|BJ|Benin|west-africa
BFA|BF|Burkina Faso|west-africa
CPV|CV|Cabo Verde|west-africa
CIV|CI|Côte d'Ivoire|west-africa
GMB|GM|The Gambia|west-africa
GHA|GH|Ghana|west-africa
GIN|GN|Guinea|west-africa
GNB|GW|Guinea-Bissau|west-africa
LBR|LR|Liberia|west-africa
MLI|ML|Mali|west-africa
MRT|MR|Mauritania|west-africa
NER|NE|Niger|west-africa
NGA|NG|Nigeria|west-africa
SEN|SN|Senegal|west-africa
SLE|SL|Sierra Leone|west-africa
TGO|TG|Togo|west-africa
AGO|AO|Angola|central-africa
CMR|CM|Cameroon|central-africa
CAF|CF|Central African Republic|central-africa
TCD|TD|Chad|central-africa
COD|CD|Democratic Republic of the Congo|central-africa
GNQ|GQ|Equatorial Guinea|central-africa
GAB|GA|Gabon|central-africa
COG|CG|Republic of the Congo|central-africa
STP|ST|São Tomé and Príncipe|central-africa
BDI|BI|Burundi|east-africa
COM|KM|Comoros|east-africa
DJI|DJ|Djibouti|east-africa
ERI|ER|Eritrea|east-africa
ETH|ET|Ethiopia|east-africa
KEN|KE|Kenya|east-africa
MDG|MG|Madagascar|east-africa
MWI|MW|Malawi|east-africa
MUS|MU|Mauritius|east-africa
MOZ|MZ|Mozambique|east-africa
RWA|RW|Rwanda|east-africa
SYC|SC|Seychelles|east-africa
SOM|SO|Somalia|east-africa
SSD|SS|South Sudan|east-africa
TZA|TZ|Tanzania|east-africa
UGA|UG|Uganda|east-africa
ZMB|ZM|Zambia|east-africa
ZWE|ZW|Zimbabwe|east-africa
BWA|BW|Botswana|southern-africa
SWZ|SZ|Eswatini|southern-africa
LSO|LS|Lesotho|southern-africa
NAM|NA|Namibia|southern-africa
ZAF|ZA|South Africa|southern-africa
KAZ|KZ|Kazakhstan|central-asia
KGZ|KG|Kyrgyzstan|central-asia
TJK|TJ|Tajikistan|central-asia
TKM|TM|Turkmenistan|central-asia
UZB|UZ|Uzbekistan|central-asia
CHN|CN|China|east-asia
JPN|JP|Japan|east-asia
MNG|MN|Mongolia|east-asia
PRK|KP|North Korea|east-asia
KOR|KR|South Korea|east-asia
BRN|BN|Brunei|southeast-asia
KHM|KH|Cambodia|southeast-asia
IDN|ID|Indonesia|southeast-asia
LAO|LA|Laos|southeast-asia
MYS|MY|Malaysia|southeast-asia
MMR|MM|Myanmar|southeast-asia
PHL|PH|Philippines|southeast-asia
SGP|SG|Singapore|southeast-asia
THA|TH|Thailand|southeast-asia
TLS|TL|Timor-Leste|southeast-asia
VNM|VN|Vietnam|southeast-asia
AFG|AF|Afghanistan|south-asia
BGD|BD|Bangladesh|south-asia
BTN|BT|Bhutan|south-asia
IND|IN|India|south-asia
MDV|MV|Maldives|south-asia
NPL|NP|Nepal|south-asia
PAK|PK|Pakistan|south-asia
LKA|LK|Sri Lanka|south-asia
ARM|AM|Armenia|west-asia
AZE|AZ|Azerbaijan|west-asia
BHR|BH|Bahrain|west-asia
CYP|CY|Cyprus|west-asia
GEO|GE|Georgia|west-asia
IRN|IR|Iran|west-asia
IRQ|IQ|Iraq|west-asia
ISR|IL|Israel|west-asia
JOR|JO|Jordan|west-asia
KWT|KW|Kuwait|west-asia
LBN|LB|Lebanon|west-asia
OMN|OM|Oman|west-asia
PSE|PS|Palestine|west-asia
QAT|QA|Qatar|west-asia
SAU|SA|Saudi Arabia|west-asia
SYR|SY|Syria|west-asia
TUR|TR|Türkiye|west-asia
ARE|AE|United Arab Emirates|west-asia
YEM|YE|Yemen|west-asia
DNK|DK|Denmark|northern-europe
EST|EE|Estonia|northern-europe
FIN|FI|Finland|northern-europe
ISL|IS|Iceland|northern-europe
IRL|IE|Ireland|northern-europe
LVA|LV|Latvia|northern-europe
LTU|LT|Lithuania|northern-europe
NOR|NO|Norway|northern-europe
SWE|SE|Sweden|northern-europe
GBR|GB|United Kingdom|northern-europe
AUT|AT|Austria|western-europe
BEL|BE|Belgium|western-europe
FRA|FR|France|western-europe
DEU|DE|Germany|western-europe
LIE|LI|Liechtenstein|western-europe
LUX|LU|Luxembourg|western-europe
MCO|MC|Monaco|western-europe
NLD|NL|Netherlands|western-europe
CHE|CH|Switzerland|western-europe
BLR|BY|Belarus|eastern-europe
BGR|BG|Bulgaria|eastern-europe
CZE|CZ|Czechia|eastern-europe
HUN|HU|Hungary|eastern-europe
MDA|MD|Moldova|eastern-europe
POL|PL|Poland|eastern-europe
ROU|RO|Romania|eastern-europe
RUS|RU|Russia|eastern-europe
SVK|SK|Slovakia|eastern-europe
UKR|UA|Ukraine|eastern-europe
ALB|AL|Albania|southern-europe
AND|AD|Andorra|southern-europe
BIH|BA|Bosnia and Herzegovina|southern-europe
HRV|HR|Croatia|southern-europe
GRC|GR|Greece|southern-europe
ITA|IT|Italy|southern-europe
MLT|MT|Malta|southern-europe
MNE|ME|Montenegro|southern-europe
MKD|MK|North Macedonia|southern-europe
PRT|PT|Portugal|southern-europe
SMR|SM|San Marino|southern-europe
SRB|RS|Serbia|southern-europe
SVN|SI|Slovenia|southern-europe
ESP|ES|Spain|southern-europe
VAT|VA|Vatican City|southern-europe
CAN|CA|Canada|northern-america
USA|US|United States|northern-america
BLZ|BZ|Belize|central-america
CRI|CR|Costa Rica|central-america
SLV|SV|El Salvador|central-america
GTM|GT|Guatemala|central-america
HND|HN|Honduras|central-america
MEX|MX|Mexico|central-america
NIC|NI|Nicaragua|central-america
PAN|PA|Panama|central-america
ATG|AG|Antigua and Barbuda|caribbean
BHS|BS|Bahamas|caribbean
BRB|BB|Barbados|caribbean
CUB|CU|Cuba|caribbean
DMA|DM|Dominica|caribbean
DOM|DO|Dominican Republic|caribbean
GRD|GD|Grenada|caribbean
HTI|HT|Haiti|caribbean
JAM|JM|Jamaica|caribbean
KNA|KN|Saint Kitts and Nevis|caribbean
LCA|LC|Saint Lucia|caribbean
VCT|VC|Saint Vincent and the Grenadines|caribbean
TTO|TT|Trinidad and Tobago|caribbean
BOL|BO|Bolivia|andean
COL|CO|Colombia|andean
ECU|EC|Ecuador|andean
PER|PE|Peru|andean
VEN|VE|Venezuela|andean
BRA|BR|Brazil|atlantic-south-america
GUY|GY|Guyana|atlantic-south-america
SUR|SR|Suriname|atlantic-south-america
ARG|AR|Argentina|southern-cone
CHL|CL|Chile|southern-cone
PRY|PY|Paraguay|southern-cone
URY|UY|Uruguay|southern-cone
AUS|AU|Australia|australia-new-zealand
NZL|NZ|New Zealand|australia-new-zealand
FJI|FJ|Fiji|melanesia
PNG|PG|Papua New Guinea|melanesia
SLB|SB|Solomon Islands|melanesia
VUT|VU|Vanuatu|melanesia
KIR|KI|Kiribati|micronesia
MHL|MH|Marshall Islands|micronesia
FSM|FM|Micronesia|micronesia
NRU|NR|Nauru|micronesia
PLW|PW|Palau|micronesia
WSM|WS|Samoa|polynesia
TON|TO|Tonga|polynesia
TUV|TV|Tuvalu|polynesia
`.trim().split('\n');

const ALIASES: Record<string, string[]> = {
  "CIV": ["Ivory Coast", "Cote d'Ivoire"],
  "CPV": ["Cape Verde"],
  "GMB": ["Gambia"],
  "COD": ["DR Congo", "DRC", "Congo-Kinshasa"],
  "COG": ["Congo", "Congo-Brazzaville"],
  "STP": ["Sao Tome and Principe"],
  "TUR": ["Turkey"],
  "CZE": ["Czech Republic"],
  "SWZ": ["Swaziland"],
  "MKD": ["Macedonia"],
  "PSE": ["State of Palestine"],
  "VAT": ["Holy See"],
  "FSM": ["Federated States of Micronesia"],
  "BOL": ["Plurinational State of Bolivia"],
  "VEN": ["Bolivarian Republic of Venezuela"]
};

const REGION_TO_CONTINENT = new Map(REGIONS.map((region) => [region.id, region.continentId]));

export const COUNTRIES: Country[] = ROWS.map((row) => {
  const [id, iso2, name, regionId] = row.split('|');
  const continentId = REGION_TO_CONTINENT.get(regionId);
  if (!continentId) throw new Error(`Unknown region ${regionId} for ${name}`);

  return { id, name, iso2, iso3: id, continentId, regionId, aliases: ALIASES[id] };
});

export const COUNTRY_BY_ID = new Map(COUNTRIES.map((country) => [country.id, country]));
export const COUNTRY_BY_ISO2 = new Map(COUNTRIES.map((country) => [country.iso2, country]));
