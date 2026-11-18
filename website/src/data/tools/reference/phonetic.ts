/**
 * NATO / ICAO radiotelephony spelling alphabet, figures and common procedure words.
 * Spellings and stressed-syllable guides follow ICAO Annex 10, Volume II (the same
 * alphabet NATO adopted and ACP 125 uses). Capitals mark the stressed syllable.
 */
import type { Provenance } from '../types';

export interface PhoneticLetter {
  letter: string;
  /** Code word as spelled in the ICAO table (note 'Alfa' and 'Juliett'). */
  word: string;
  /** Pronunciation guide; capitals are stressed. */
  say: string;
}

export interface PhoneticDigit {
  digit: string;
  word: string;
  say: string;
}

export interface Proword {
  word: string;
  meaning: string;
}

const letters: PhoneticLetter[] = [
  { letter: 'A', word: 'Alfa', say: 'AL-fah' },
  { letter: 'B', word: 'Bravo', say: 'BRAH-voh' },
  { letter: 'C', word: 'Charlie', say: 'CHAR-lee (or SHAR-lee)' },
  { letter: 'D', word: 'Delta', say: 'DELL-tah' },
  { letter: 'E', word: 'Echo', say: 'ECK-oh' },
  { letter: 'F', word: 'Foxtrot', say: 'FOKS-trot' },
  { letter: 'G', word: 'Golf', say: 'golf' },
  { letter: 'H', word: 'Hotel', say: 'hoh-TELL' },
  { letter: 'I', word: 'India', say: 'IN-dee-ah' },
  { letter: 'J', word: 'Juliett', say: 'JEW-lee-ETT' },
  { letter: 'K', word: 'Kilo', say: 'KEY-loh' },
  { letter: 'L', word: 'Lima', say: 'LEE-mah' },
  { letter: 'M', word: 'Mike', say: 'mike' },
  { letter: 'N', word: 'November', say: 'no-VEM-ber' },
  { letter: 'O', word: 'Oscar', say: 'OSS-cah' },
  { letter: 'P', word: 'Papa', say: 'pah-PAH' },
  { letter: 'Q', word: 'Quebec', say: 'keh-BECK' },
  { letter: 'R', word: 'Romeo', say: 'ROW-me-oh' },
  { letter: 'S', word: 'Sierra', say: 'see-AIR-rah' },
  { letter: 'T', word: 'Tango', say: 'TANG-go' },
  { letter: 'U', word: 'Uniform', say: 'YOU-nee-form (or OO-nee-form)' },
  { letter: 'V', word: 'Victor', say: 'VIK-tah' },
  { letter: 'W', word: 'Whiskey', say: 'WISS-key' },
  { letter: 'X', word: 'X-ray', say: 'ECKS-ray' },
  { letter: 'Y', word: 'Yankee', say: 'YANG-key' },
  { letter: 'Z', word: 'Zulu', say: 'ZOO-loo' },
];

const digits: PhoneticDigit[] = [
  { digit: '0', word: 'Zero', say: 'ZE-RO' },
  { digit: '1', word: 'One', say: 'WUN' },
  { digit: '2', word: 'Two', say: 'TOO' },
  { digit: '3', word: 'Three', say: 'TREE' },
  { digit: '4', word: 'Four', say: 'FOW-er' },
  { digit: '5', word: 'Five', say: 'FIFE' },
  { digit: '6', word: 'Six', say: 'SIX' },
  { digit: '7', word: 'Seven', say: 'SEV-en' },
  { digit: '8', word: 'Eight', say: 'AIT' },
  { digit: '9', word: 'Nine', say: 'NIN-er' },
];

/** Extra number words from the same ICAO table. */
const numberWords: PhoneticDigit[] = [
  { digit: '.', word: 'Decimal', say: 'DAY-SEE-MAL' },
  { digit: '00', word: 'Hundred', say: 'HUN-dred' },
  { digit: '000', word: 'Thousand', say: 'TOU-SAND' },
];

const prowords: Proword[] = [
  { word: 'Roger', meaning: 'I have received your whole last transmission. It does not mean yes or that you will comply.' },
  { word: 'Wilco', meaning: 'Short for "will comply": I understood your instruction and will carry it out. Already implies Roger, so never say both.' },
  { word: 'Over', meaning: 'I have finished this transmission and expect you to answer.' },
  { word: 'Out', meaning: 'This exchange is finished and no answer is expected. "Over" and "Out" are never used together.' },
  { word: 'Say again', meaning: 'Repeat your last transmission, or the part named after it (for example "say again all after grid").' },
  { word: 'Break', meaning: 'Marks a pause between separate parts of one message, or between messages to different stations.' },
  { word: 'I say again', meaning: 'I am repeating my transmission, or the part I name, for emphasis or clarity.' },
  { word: 'Wait', meaning: 'Stand by for a few seconds; I will come back to you.' },
  { word: 'Wait out', meaning: 'I need longer than a few seconds and will call you back.' },
  { word: 'Correction', meaning: 'I made an error; the correct version follows.' },
  { word: 'Read back', meaning: 'Repeat this message back to me exactly as you received it.' },
  { word: 'Radio check', meaning: 'Tell me how strong and how clear my signal is reaching you.' },
];

export const phonetic = {
  letters,
  digits,
  numberWords,
  prowords,
  provenance: {
    verified: '2026-11-18',
    sources: [
      { label: 'ICAO Annex 10, Aeronautical Telecommunications, Vol. II (radiotelephony spelling alphabet and figures)', url: 'https://store.icao.int/en/annex-10-aeronautical-telecommunications-volume-ii-communication-procedures-including-those-with-pans-status' },
      { label: 'ACP 125, Communications Instructions: Radiotelephone Procedures (Combined Communications-Electronics Board)', url: 'https://www.ccebinfo.com/' },
    ],
    notes:
      'The 26 code words and the digit words are fixed by ICAO Annex 10 and used unchanged by NATO and U.S. forces. ' +
      'Pronunciation guides follow the ICAO stressed-syllable table. Proword meanings are written in plain words and follow ACP 125 usage.',
    unverified: [
      'Source links: ICAO Annex 10 is sold, not free, and the CCEB site hosts ACP 125 behind a document index. Confirm the exact edition (ACP 125(H) or later) and replace the links with the specific document pages before promotion.',
      'Proword list is a selection, not the full ACP 125 table; meanings were written from the standard usage, not quoted.',
    ],
  } satisfies Provenance,
};
