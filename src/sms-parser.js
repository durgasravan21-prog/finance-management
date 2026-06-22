// ─────────────────────────────────────────────────────────────
// sms-parser.js  –  Indian Bank UPI Credit SMS Parser (ES Module)
// ─────────────────────────────────────────────────────────────
// Exports:
//   parseBankSMS(smsText)           → parsed object
//   matchVPAToBorrower(vpa, list)   → matched borrower | null
//   SAMPLE_SMS                      → array of sample SMS strings
// ─────────────────────────────────────────────────────────────

/* ── Helpers ─────────────────────────────────────────────── */

/**
 * Normalise an amount string → number.
 * Handles "2,500.00", "2500", "2500.00", "₹2,500", etc.
 */
function parseAmount(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/[₹,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Normalise various Indian‐bank date strings → "YYYY-MM-DD".
 * Accepted inputs (examples):
 *   22-Jun-25, 22-Jun-2025, 22-06-25, 22-06-2025,
 *   22/06/2025, 22Jun2025, 22Jun25, 2025-06-22
 */
function parseDate(raw) {
  if (!raw) return null;

  const monthMap = {
    jan: '01', feb: '02', mar: '03', apr: '04',
    may: '05', jun: '06', jul: '07', aug: '08',
    sep: '09', oct: '10', nov: '11', dec: '12',
  };

  let day, month, year;

  // ISO‐style: 2025-06-22
  let m = raw.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (m) {
    [, year, month, day] = m;
    return `${year}-${month}-${day}`;
  }

  // dd-Mon-yy(yy)  e.g. 22-Jun-25, 22-Jun-2025
  m = raw.match(/^(\d{1,2})[-/]([A-Za-z]{3})[-/](\d{2,4})$/);
  if (m) {
    day = m[1].padStart(2, '0');
    month = monthMap[m[2].toLowerCase()];
    year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return month ? `${year}-${month}-${day}` : null;
  }

  // dd-mm-yy(yy) or dd/mm/yy(yy)  e.g. 22-06-25, 22/06/2025
  m = raw.match(/^(\d{1,2})[-/](\d{2})[-/](\d{2,4})$/);
  if (m) {
    day = m[1].padStart(2, '0');
    month = m[2];
    year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${year}-${month}-${day}`;
  }

  // ddMonyy(yy)  e.g. 22Jun2025, 22Jun25  (BoB style, no separator)
  m = raw.match(/^(\d{1,2})([A-Za-z]{3})(\d{2,4})$/);
  if (m) {
    day = m[1].padStart(2, '0');
    month = monthMap[m[2].toLowerCase()];
    year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return month ? `${year}-${month}-${day}` : null;
  }

  return null;
}

/**
 * Build a default (empty) result object.
 */
function emptyResult(rawText) {
  return {
    amount: null,
    date: null,
    senderVPA: null,
    accountLast4: null,
    availableBalance: null,
    upiRefNo: null,
    bankTag: null,
    rawText,
    parsed: false,
  };
}

/* ── Regex building blocks (reusable) ────────────────────── */

// Currency prefix: Rs, Rs., INR, ₹  — with optional trailing space
const CUR   = /(?:Rs\.?|INR|₹)\s*/;
// Amount with optional commas: 2,500.00 or 2500 or 2500.00
const AMT   = /(\d+(?:,\d+)*(?:\.\d{1,2})?)/;

// VPA pattern: alphanumeric + dots/hyphens @ handle
const VPA   = /([\w.\-]+@[\w.\-]+)/;

// Account last‐4 (preceded by XX / XXXX / **)
const ACCT  = /(?:X{2,}|x{2,}|\*{2,})(\d{4})/;

// UPI Reference number (10‑14 digits)
const UPIREF = /(\d{10,14})/;

/* ── Bank‑specific parsers (ordered by specificity) ──────── */

const bankParsers = [

  /* 1 ── SBI ──────────────────────────────────────────────── */
  {
    tag: 'SBI',
    test: (sms) => /SBI|State Bank/i.test(sms) && /credited/i.test(sms),
    parse(sms) {
      // "your A/c XXXX1234 credited by Rs.2500.00 on 22-Jun-25 by VPA venkatesh@okaxis (UPI Ref No 512345678901). Avl Bal Rs.47230.50"
      const r = emptyResult(sms);
      r.bankTag = 'SBI';

      let m;

      // Account
      m = sms.match(/A\/c\s*(?:no\.?\s*)?(?:X{2,}|x{2,}|\*{2,})(\d{4})/i);
      if (m) r.accountLast4 = m[1];

      // Amount  (credited by Rs.2500.00)
      m = sms.match(new RegExp(`credited\\s+(?:by\\s+)?${CUR.source}${AMT.source}`, 'i'));
      if (m) r.amount = parseAmount(m[1]);

      // Date
      m = sms.match(/on\s+([\d]{1,2}[-/][A-Za-z]{3}[-/]\d{2,4}|\d{1,2}[-/]\d{2}[-/]\d{2,4}|\d{4}[-/]\d{2}[-/]\d{2})/i);
      if (m) r.date = parseDate(m[1]);

      // VPA
      m = sms.match(/VPA\s+/i) ? sms.match(new RegExp(`VPA\\s+${VPA.source}`, 'i')) : null;
      if (m) r.senderVPA = m[1];

      // UPI Ref
      m = sms.match(/UPI\s*Ref\s*(?:No\.?\s*)?(\d{10,14})/i);
      if (m) r.upiRefNo = m[1];

      // Available Balance
      m = sms.match(new RegExp(`Avl\\.?\\s*Bal\\.?\\s*${CUR.source}${AMT.source}`, 'i'));
      if (m) r.availableBalance = parseAmount(m[1]);

      r.parsed = !!(r.amount && r.senderVPA);
      return r;
    },
  },

  /* 2 ── HDFC ─────────────────────────────────────────────── */
  {
    tag: 'HDFC',
    test: (sms) => /HDFC/i.test(sms) && /credited/i.test(sms),
    parse(sms) {
      // "Rs 2500.00 credited to A/c XXXX1234 on 22-06-25 by VPA venkatesh@oksbi. Avl Bal:Rs 47230.50. Txn Ref:512345678901"
      const r = emptyResult(sms);
      r.bankTag = 'HDFC';

      let m;

      // Amount  (Rs 2500.00 credited)
      m = sms.match(new RegExp(`${CUR.source}${AMT.source}\\s+credited`, 'i'));
      if (m) r.amount = parseAmount(m[1]);

      // Account
      m = sms.match(/A\/c\s*(?:X{2,}|x{2,}|\*{2,})(\d{4})/i);
      if (m) r.accountLast4 = m[1];

      // Date
      m = sms.match(/on\s+([\d]{1,2}[-/][\dA-Za-z]{2,3}[-/]\d{2,4})/i);
      if (m) r.date = parseDate(m[1]);

      // VPA
      m = sms.match(new RegExp(`VPA\\s+${VPA.source}`, 'i'));
      if (m) r.senderVPA = m[1];

      // Available Balance
      m = sms.match(new RegExp(`Avl\\.?\\s*Bal\\.?\\s*:?\\s*${CUR.source}${AMT.source}`, 'i'));
      if (m) r.availableBalance = parseAmount(m[1]);

      // Txn Ref
      m = sms.match(/Txn\s*Ref\s*:?\s*(\d{10,14})/i);
      if (m) r.upiRefNo = m[1];

      r.parsed = !!(r.amount && r.senderVPA);
      return r;
    },
  },

  /* 3 ── ICICI ────────────────────────────────────────────── */
  {
    tag: 'ICICI',
    test: (sms) => /ICICI/i.test(sms) && /credited/i.test(sms),
    parse(sms) {
      // "Your a/c XX1234 is credited with INR 2,500.00 on 22-Jun-2025. UPI/venkatesh@okaxis/512345678901. Avl bal INR 47,230.50"
      const r = emptyResult(sms);
      r.bankTag = 'ICICI';

      let m;

      // Account
      m = sms.match(/a\/c\s*(?:X{2,}|x{2,}|\*{2,})(\d{4})/i);
      if (m) r.accountLast4 = m[1];

      // Amount
      m = sms.match(new RegExp(`credited\\s+with\\s+${CUR.source}${AMT.source}`, 'i'));
      if (m) r.amount = parseAmount(m[1]);

      // Date
      m = sms.match(/on\s+([\d]{1,2}[-/][A-Za-z]{3}[-/]\d{2,4}|\d{1,2}[-/]\d{2}[-/]\d{2,4})/i);
      if (m) r.date = parseDate(m[1]);

      // VPA  – UPI/vpa/ref format
      m = sms.match(new RegExp(`UPI\\s*/\\s*${VPA.source}`, 'i'));
      if (m) r.senderVPA = m[1];

      // UPI Ref (third segment after UPI/vpa/)
      m = sms.match(/UPI\/[\w.\-]+@[\w.\-]+\/(\d{10,14})/i);
      if (m) r.upiRefNo = m[1];

      // Available Balance
      m = sms.match(new RegExp(`Avl\\.?\\s*bal\\.?\\s*${CUR.source}${AMT.source}`, 'i'));
      if (m) r.availableBalance = parseAmount(m[1]);

      r.parsed = !!(r.amount && r.senderVPA);
      return r;
    },
  },

  /* 4 ── Canara Bank ──────────────────────────────────────── */
  {
    tag: 'CANARA',
    test: (sms) => /Canara/i.test(sms) || (/credited/i.test(sms) && /UPI-/i.test(sms)),
    parse(sms) {
      // "Rs.2500.00 credited to your A/c XXXX1234 on 22/06/2025 by UPI-venkatesh@okaxis. Bal:Rs.47230.50"
      const r = emptyResult(sms);
      r.bankTag = 'CANARA';

      let m;

      // Amount
      m = sms.match(new RegExp(`${CUR.source}${AMT.source}\\s+credited`, 'i'));
      if (m) r.amount = parseAmount(m[1]);

      // Account
      m = sms.match(/A\/c\s*(?:X{2,}|x{2,}|\*{2,})(\d{4})/i);
      if (m) r.accountLast4 = m[1];

      // Date
      m = sms.match(/on\s+([\d]{1,2}[-/][\dA-Za-z]{2,3}[-/]\d{2,4})/i);
      if (m) r.date = parseDate(m[1]);

      // VPA  – UPI-vpa
      m = sms.match(new RegExp(`UPI[-–]\\s*${VPA.source}`, 'i'));
      if (m) r.senderVPA = m[1];

      // Balance
      m = sms.match(new RegExp(`Bal\\.?\\s*:?\\s*${CUR.source}${AMT.source}`, 'i'));
      if (m) r.availableBalance = parseAmount(m[1]);

      r.parsed = !!(r.amount && r.senderVPA);
      return r;
    },
  },

  /* 5 ── Bank of Baroda (BoB) ─────────────────────────────── */
  {
    tag: 'BOB',
    test: (sms) => /UPI User/i.test(sms) || (/BoB|Bank of Baroda/i.test(sms) && /credited/i.test(sms)),
    parse(sms) {
      // "Dear UPI User,Ur A/c XX1234 is credited by Rs.2500.00 on 22Jun2025. UPI Ref:512345678901. VPA:venkatesh@okaxis"
      const r = emptyResult(sms);
      r.bankTag = 'BOB';

      let m;

      // Account
      m = sms.match(/A\/c\s*(?:X{2,}|x{2,}|\*{2,})(\d{4})/i);
      if (m) r.accountLast4 = m[1];

      // Amount
      m = sms.match(new RegExp(`credited\\s+(?:by\\s+)?${CUR.source}${AMT.source}`, 'i'));
      if (m) r.amount = parseAmount(m[1]);

      // Date  – supports "22Jun2025" (no separator) and standard formats
      m = sms.match(/on\s+(\d{1,2}[A-Za-z]{3}\d{2,4}|\d{1,2}[-/][\dA-Za-z]{2,3}[-/]\d{2,4})/i);
      if (m) r.date = parseDate(m[1]);

      // UPI Ref
      m = sms.match(/UPI\s*Ref\s*:?\s*(\d{10,14})/i);
      if (m) r.upiRefNo = m[1];

      // VPA  – "VPA:venkatesh@okaxis" or "VPA: venkatesh@okaxis"
      m = sms.match(new RegExp(`VPA\\s*:?\\s*${VPA.source}`, 'i'));
      if (m) r.senderVPA = m[1];

      r.parsed = !!(r.amount && r.senderVPA);
      return r;
    },
  },

  /* 6 ── PNB ──────────────────────────────────────────────── */
  {
    tag: 'PNB',
    test: (sms) => /PNB|Punjab National/i.test(sms) && /credited/i.test(sms),
    parse(sms) {
      // "Your A/c XX1234 credited Rs.2500.00 on 22-06-2025 from VPA venkatesh@okaxis thru UPI Ref 512345678901."
      const r = emptyResult(sms);
      r.bankTag = 'PNB';

      let m;

      // Account
      m = sms.match(/A\/c\s*(?:X{2,}|x{2,}|\*{2,})(\d{4})/i);
      if (m) r.accountLast4 = m[1];

      // Amount
      m = sms.match(new RegExp(`credited\\s+${CUR.source}${AMT.source}`, 'i'));
      if (m) r.amount = parseAmount(m[1]);

      // Date
      m = sms.match(/on\s+([\d]{1,2}[-/][\dA-Za-z]{2,3}[-/]\d{2,4})/i);
      if (m) r.date = parseDate(m[1]);

      // VPA
      m = sms.match(new RegExp(`(?:from\\s+)?VPA\\s+${VPA.source}`, 'i'));
      if (m) r.senderVPA = m[1];

      // UPI Ref
      m = sms.match(/UPI\s*Ref\s*:?\s*(\d{10,14})/i);
      if (m) r.upiRefNo = m[1];

      // Balance (if present)
      m = sms.match(new RegExp(`(?:Avl\\.?\\s*)?Bal\\.?\\s*:?\\s*${CUR.source}${AMT.source}`, 'i'));
      if (m) r.availableBalance = parseAmount(m[1]);

      r.parsed = !!(r.amount && r.senderVPA);
      return r;
    },
  },
];

/* ── Generic / fallback parser ───────────────────────────── */

function genericParse(sms) {
  const r = emptyResult(sms);
  r.bankTag = 'GENERIC';

  let m;

  // Must contain "credited" to be relevant
  if (!/credited/i.test(sms)) return r;

  // Account
  m = sms.match(/A\/c\s*(?:X{2,}|x{2,}|\*{2,})(\d{4})/i);
  if (m) r.accountLast4 = m[1];

  // Amount – try "credited by/with Rs.X" first, then "Rs.X credited"
  m = sms.match(new RegExp(`credited\\s+(?:by\\s+|with\\s+)?${CUR.source}${AMT.source}`, 'i'));
  if (!m) m = sms.match(new RegExp(`${CUR.source}${AMT.source}\\s+(?:has been\\s+)?credited`, 'i'));
  if (!m) m = sms.match(new RegExp(`(?:amount|amt)\\s+(?:of\\s+)?${CUR.source}${AMT.source}`, 'i'));
  if (m) r.amount = parseAmount(m[1]);

  // Date – broad pattern
  m = sms.match(/(?:on|dated?)\s+(\d{1,2}[-/][A-Za-z\d]{2,3}[-/]\d{2,4}|\d{1,2}[A-Za-z]{3}\d{2,4}|\d{4}[-/]\d{2}[-/]\d{2})/i);
  if (m) r.date = parseDate(m[1]);

  // VPA – multiple patterns
  m = sms.match(new RegExp(`(?:VPA|UPI)\\s*[:/\\-]?\\s*${VPA.source}`, 'i'));
  if (!m) m = sms.match(new RegExp(`(?:from|by)\\s+${VPA.source}`, 'i'));
  // Last resort: any @-handle that looks like a UPI VPA (word@word)
  if (!m) m = sms.match(/([\w.\-]+@(?:ok|pay|upi|ybl|apl|ibl|axl|sbi|icici|paytm)[\w.\-]*)/i);
  // Absolute fallback: match any email/vpa-like pattern containing @ (e.g. @ptyes)
  if (!m) m = sms.match(/([\w.\-]+@[\w.\-]+)/);
  if (m) r.senderVPA = m[1];

  // UPI Ref
  m = sms.match(/(?:UPI|Txn|UTR)\s*(?:Ref|No|ID)\s*[:.#]?\s*(\d{10,14})/i);
  if (m) r.upiRefNo = m[1];

  // Balance
  m = sms.match(new RegExp(`(?:Avl\\.?\\s*)?Bal(?:ance)?\\.?\\s*:?\\s*${CUR.source}${AMT.source}`, 'i'));
  if (m) r.availableBalance = parseAmount(m[1]);

  r.parsed = !!(r.amount && r.senderVPA);
  return r;
}

/* ── Public API ──────────────────────────────────────────── */

/**
 * Parse an Indian bank UPI credit SMS.
 *
 * @param  {string} smsText  Raw SMS body
 * @return {{
 *   amount:            number|null,
 *   date:              string|null,   // "YYYY-MM-DD"
 *   senderVPA:         string|null,   // e.g. "venkatesh@okaxis"
 *   accountLast4:      string|null,   // e.g. "1234"
 *   availableBalance:  number|null,
 *   upiRefNo:          string|null,
 *   bankTag:           string|null,   // SBI, HDFC, ICICI, CANARA, BOB, PNB, GENERIC
 *   rawText:           string,
 *   parsed:            boolean
 * }}
 */
export function parseBankSMS(smsText) {
  if (!smsText || typeof smsText !== 'string') {
    return emptyResult(smsText ?? '');
  }

  const trimmed = smsText.trim();

  // Try each bank‐specific parser in order
  for (const bp of bankParsers) {
    if (bp.test(trimmed)) {
      const result = bp.parse(trimmed);
      if (result.parsed) return result;
      // If the specific parser matched the test but couldn't fully parse,
      // fall through to the next parser (or generic).
    }
  }

  // Fallback → generic
  return genericParse(trimmed);
}

/**
 * Match a VPA against a list of borrowers.
 *
 * Each borrower in `borrowers` should have at least:
 *   { name: string, vpa: string | string[] }
 *
 * Matching is case‐insensitive. If a borrower has multiple VPAs
 * (stored as an array), any match counts.
 *
 * @param  {string}   vpa        The sender VPA from the SMS
 * @param  {Array}    borrowers  Array of borrower objects
 * @return {object|null}         Matched borrower or null
 */
export function matchVPAToBorrower(vpa, borrowers) {
  if (!vpa || !Array.isArray(borrowers)) return null;

  const needle = vpa.toLowerCase().trim();

  for (const b of borrowers) {
    const vpas = Array.isArray(b.vpa) ? b.vpa : [b.vpa];
    for (const v of vpas) {
      if (v && v.toLowerCase().trim() === needle) {
        return b;
      }
    }
  }

  return null;
}

/* ── Sample SMS strings for testing ──────────────────────── */

export const SAMPLE_SMS = [
  // SBI
  `Dear Customer, your A/c XXXX1234 credited by Rs.2500.00 on 22-Jun-25 by VPA venkatesh@okaxis (UPI Ref No 512345678901). Avl Bal Rs.47230.50-SBI`,

  // HDFC
  `Rs 2500.00 credited to A/c XXXX1234 on 22-06-25 by VPA venkatesh@oksbi. Avl Bal:Rs 47230.50. Txn Ref:512345678901-HDFC`,

  // ICICI
  `Your a/c XX1234 is credited with INR 2,500.00 on 22-Jun-2025. UPI/venkatesh@okaxis/512345678901. Avl bal INR 47,230.50-ICICI`,

  // Canara
  `Rs.2500.00 credited to your A/c XXXX1234 on 22/06/2025 by UPI-venkatesh@okaxis. Bal:Rs.47230.50-Canara`,

  // BoB
  `Dear UPI User,Ur A/c XX1234 is credited by Rs.2500.00 on 22Jun2025. UPI Ref:512345678901. VPA:venkatesh@okaxis`,

  // PNB
  `Your A/c XX1234 credited Rs.2500.00 on 22-06-2025 from VPA venkatesh@okaxis thru UPI Ref 512345678901.-PNB`,

  // Generic with ₹ symbol and commas
  `₹1,00,000.00 has been credited to your A/c XXXX5678 on 15-Mar-2025 via UPI. VPA: ramesh.kumar@ybl. Avl Balance: ₹2,34,567.89`,

  // Generic with small amount and minimal info
  `Rs.50.00 credited to A/c XX9876 on 01/01/2026 by VPA friend@paytm.`,

  // Edge case: large amount with Indian comma style
  `Dear Customer, your A/c XXXX4321 credited by Rs.10,00,000.00 on 30-Dec-25 by VPA business@okicici (UPI Ref No 998877665544). Avl Bal Rs.12,50,000.00-SBI`,
];
