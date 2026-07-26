// Parseur MRZ (Machine Readable Zone, norme ICAO 9303) — fonction pure, sans
// dépendance à l'OCR : prend le texte brut déjà extrait d'une image et tente
// d'y localiser puis décoder la zone MRZ. Supporte TD3 (passeport, 2 lignes
// de 44 caractères) et TD1 (CIN biométrique marocaine, 3 lignes de 30
// caractères). Inclut une tolérance OCR (correction de '«', '‹', confusions O/0)
// ainsi qu'un extracteur de secours par expressions régulières pour les passeports
// sans zone MRZ lisible.

export type MrzFormat = 'TD3_PASSEPORT' | 'TD1_CIN';

export interface MrzResult {
  formatDetecte: MrzFormat | null;
  numeroPiece: string | null;
  nom: string | null;
  prenom: string | null;
  nationalite: string | null;
  dateNaissance: string | null;
  sexe: 'M' | 'F' | null;
  dateExpiration: string | null;
  checksumValide: boolean;
  lignesMrz: string[];
}

const EMPTY_RESULT: MrzResult = {
  formatDetecte: null,
  numeroPiece: null,
  nom: null,
  prenom: null,
  nationalite: null,
  dateNaissance: null,
  sexe: null,
  dateExpiration: null,
  checksumValide: false,
  lignesMrz: [],
};

const CHECK_WEIGHTS = [7, 3, 1];

function charValue(c: string): number {
  if (c === '<') return 0;
  if (c >= '0' && c <= '9') return c.charCodeAt(0) - 48;
  if (c >= 'A' && c <= 'Z') return c.charCodeAt(0) - 65 + 10;
  return 0;
}

function computeCheckDigit(input: string): number {
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    sum += charValue(input[i]) * CHECK_WEIGHTS[i % 3];
  }
  return sum % 10;
}

function checkDigitMatches(
  field: string,
  digitChar: string | undefined,
): boolean {
  if (!digitChar || !/^[0-9]$/.test(digitChar)) return false;
  return computeCheckDigit(field) === Number(digitChar);
}

// Convertit les confusions OCR typiques lettres -> chiffres (ex: O->0, I->1) dans les champs numériques
function fixDigits(s: string): string {
  return s
    .replace(/[OQ]/g, '0')
    .replace(/[ILl|]/g, '1')
    .replace(/Z/g, '2')
    .replace(/S/g, '5')
    .replace(/B/g, '8')
    .replace(/G/g, '6');
}

// Nettoie une ligne MRZ brute des artéfacts d'OCR fréquents (guillemets français, symboles divers)
function sanitizeMrzLine(line: string): string {
  return line
    .toUpperCase()
    .replace(/[«‹€~|_=\-/\\(){}[\]?!\s]/g, '<')
    .replace(/[^A-Z0-9<]/g, '');
}

function parseMrzDate(yymmdd: string): string | null {
  const cleaned = fixDigits(yymmdd);
  if (!/^[0-9]{6}$/.test(cleaned)) return null;
  const yy = Number(cleaned.slice(0, 2));
  const mm = cleaned.slice(2, 4);
  const dd = cleaned.slice(4, 6);
  const currentYY = new Date().getFullYear() % 100;
  const century = yy > currentYY + 10 ? 1900 : 2000;
  return `${century + yy}-${mm}-${dd}`;
}

function parseName(field: string): { nom: string; prenom: string } {
  const [surname, given] = field.split('<<');
  const clean = (s?: string) =>
    (s ?? '').replace(/</g, ' ').trim().replace(/\s+/g, ' ');
  return { nom: clean(surname), prenom: clean(given) };
}

function extractMrzLines(
  rawText: string,
  expectedLength: number,
  expectedCount: number,
): string[] {
  const lines = rawText.split('\n').map(sanitizeMrzLine);
  const candidates = lines.filter((line) => line.length >= expectedLength - 8);

  const relevant = candidates.slice(-expectedCount);
  if (relevant.length !== expectedCount) return [];

  return relevant.map((line) =>
    line.length >= expectedLength
      ? line.slice(0, expectedLength)
      : line.padEnd(expectedLength, '<'),
  );
}

function parseTd3(lines: string[]): MrzResult {
  const [line1, line2] = lines;
  const { nom, prenom } = parseName(line1.slice(5, 44));

  const numeroRaw = line2.slice(0, 9);
  const numeroClean = numeroRaw.replace(/</g, '').trim();
  const naissanceRaw = fixDigits(line2.slice(13, 19));
  const expirationRaw = fixDigits(line2.slice(21, 27));
  const sexeChar = line2[20];

  return {
    formatDetecte: 'TD3_PASSEPORT',
    numeroPiece: numeroClean || null,
    nom: nom || null,
    prenom: prenom || null,
    nationalite: line2.slice(10, 13).replace(/</g, '') || null,
    dateNaissance: parseMrzDate(naissanceRaw),
    sexe: sexeChar === 'M' || sexeChar === 'F' ? sexeChar : null,
    dateExpiration: parseMrzDate(expirationRaw),
    checksumValide:
      checkDigitMatches(numeroRaw, line2[9]) &&
      checkDigitMatches(naissanceRaw, line2[19]) &&
      checkDigitMatches(expirationRaw, line2[27]),
    lignesMrz: lines,
  };
}

function parseTd1(lines: string[]): MrzResult {
  const [line1, line2, line3] = lines;
  const { nom, prenom } = parseName(line3);

  const numeroRaw = line1.slice(5, 14);
  const numeroClean = numeroRaw.replace(/</g, '').trim();
  const naissanceRaw = fixDigits(line2.slice(0, 6));
  const expirationRaw = fixDigits(line2.slice(8, 14));
  const sexeChar = line2[7];

  return {
    formatDetecte: 'TD1_CIN',
    numeroPiece: numeroClean || null,
    nom: nom || null,
    prenom: prenom || null,
    nationalite: line2.slice(15, 18).replace(/</g, '') || null,
    dateNaissance: parseMrzDate(naissanceRaw),
    sexe: sexeChar === 'M' || sexeChar === 'F' ? sexeChar : null,
    dateExpiration: parseMrzDate(expirationRaw),
    checksumValide:
      checkDigitMatches(numeroRaw, line1[14]) &&
      checkDigitMatches(naissanceRaw, line2[6]) &&
      checkDigitMatches(expirationRaw, line2[14]),
    lignesMrz: lines,
  };
}

// Extracteur de secours par Regex lorsque la zone MRZ est absente ou illisible
function parseFallbackText(rawText: string): MrzResult {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const upperText = rawText.toUpperCase();

  let numeroPiece: string | null = null;
  let nom: string | null = null;
  let prenom: string | null = null;
  let dateNaissance: string | null = null;
  let dateExpiration: string | null = null;
  let sexe: 'M' | 'F' | null = null;
  let nationalite: string | null = null;

  // 1. Numéro de pièce / passeport (ex: 8-10 alfanumériques)
  const docNumMatch =
    upperText.match(
      /(?:PASSPORT|PASSEPORT|PASAPORTE|DOC|NO|N°|NUMBER|PIECE)\s*[:.]?\s*([A-Z0-9]{7,10})/i,
    ) || upperText.match(/\b([A-Z][0-9]{7,8}|[0-9]{8,9}|[A-Z]{2}[0-9]{7})\b/);
  if (docNumMatch) {
    numeroPiece = docNumMatch[1].replace(/[^A-Z0-9]/g, '');
  }

  // 2. Nom & Prénom
  for (let i = 0; i < lines.length; i++) {
    const lineUpper = lines[i].toUpperCase();
    if (
      lineUpper.includes('SURNAME') ||
      lineUpper.includes('NOM /') ||
      lineUpper.includes('NOM:') ||
      lineUpper.startsWith('NOM')
    ) {
      const nextLine = lines[i + 1] || '';
      if (nextLine && !nextLine.toUpperCase().includes('GIVEN')) {
        nom = nextLine.replace(/[^A-Za-z\s-]/g, '').trim();
      }
    }
    if (
      lineUpper.includes('GIVEN') ||
      lineUpper.includes('PRENOM') ||
      lineUpper.includes('PRÉNOM')
    ) {
      const nextLine = lines[i + 1] || '';
      if (nextLine) {
        prenom = nextLine.replace(/[^A-Za-z\s-]/g, '').trim();
      }
    }
  }

  // 3. Dates (JJ/MM/AAAA ou AAAA-MM-JJ)
  const dateMatches = upperText.match(
    /\b(0[1-9]|[12][0-9]|3[01])[/.\- ](0[1-9]|1[012])[/.\- ](19[0-9]{2}|20[0-9]{2})\b/g,
  );
  if (dateMatches && dateMatches.length >= 1) {
    const formatted = dateMatches.map((d) => {
      const parts = d.split(/[/.\- ]/);
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    });
    dateNaissance = formatted[0];
    if (formatted.length > 1) {
      dateExpiration = formatted[formatted.length - 1];
    }
  }

  // 4. Sexe
  if (/\b(SEXE|SEX)\s*[:.]?\s*M\b|\bMASCULIN\b|\bMALE\b/.test(upperText)) {
    sexe = 'M';
  } else if (
    /\b(SEXE|SEX)\s*[:.]?\s*F\b|\bFEMININ\b|\bFEMALE\b/.test(upperText)
  ) {
    sexe = 'F';
  }

  // 5. Nationalité
  if (upperText.includes('MAROC') || upperText.includes('MOROCCO')) {
    nationalite = 'MAR';
  } else if (upperText.includes('FRAN') || upperText.includes('FRANCE')) {
    nationalite = 'FRA';
  } else if (upperText.includes('ESPAG') || upperText.includes('SPAIN')) {
    nationalite = 'ESP';
  } else if (upperText.includes('UNITED STATES') || upperText.includes('USA')) {
    nationalite = 'USA';
  }

  if (numeroPiece || nom || dateNaissance) {
    const isPassport =
      upperText.includes('PASSPORT') || upperText.includes('PASSEPORT');
    return {
      formatDetecte: isPassport ? 'TD3_PASSEPORT' : 'TD1_CIN',
      numeroPiece,
      nom,
      prenom,
      nationalite,
      dateNaissance,
      sexe,
      dateExpiration,
      checksumValide: false,
      lignesMrz: [lines.slice(0, 3).join(' ')],
    };
  }

  return EMPTY_RESULT;
}

export function parseMrzFromText(rawText: string): MrzResult {
  const td3Lines = extractMrzLines(rawText, 44, 2);
  if (
    td3Lines.length === 2 &&
    (td3Lines[0].startsWith('P') ||
      td3Lines[0].includes('<<') ||
      td3Lines[1].length === 44)
  ) {
    const parsedTd3 = parseTd3(td3Lines);
    if (parsedTd3.numeroPiece || parsedTd3.nom) {
      return parsedTd3;
    }
  }

  const td1Lines = extractMrzLines(rawText, 30, 3);
  if (td1Lines.length === 3) {
    const parsedTd1 = parseTd1(td1Lines);
    if (parsedTd1.numeroPiece || parsedTd1.nom) {
      return parsedTd1;
    }
  }

  // Tente l'extraction de secours si la MRZ n'a pas pu être décodée
  return parseFallbackText(rawText);
}
