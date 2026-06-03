const SENTENCE_PATTERN = /[^.!?]+[.!?]+|[^.!?]+$/g;
const LONG_SENTENCE_FINGERPRINT_MIN_LENGTH = 80;
const LONG_SENTENCE_MIN_WORDS = 8;

function getSentenceFingerprint(sentence) {
  const words = sentence
    .toLowerCase()
    .replace(/[.,!?;:()[\]{}"'\u00ab\u00bb]/g, " ")
    .replace(/[-\u2013\u2014]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (words.length >= LONG_SENTENCE_MIN_WORDS) {
    const withoutLeadWord = words.slice(1).join(" ");

    if (withoutLeadWord.length >= LONG_SENTENCE_FINGERPRINT_MIN_LENGTH) {
      return withoutLeadWord;
    }
  }

  return words.join(" ");
}

function compactDuplicatedLongSentences(paragraph) {
  const sentences = paragraph.match(SENTENCE_PATTERN) || [paragraph];
  const seen = new Set();
  const result = [];

  for (const rawSentence of sentences) {
    const sentence = rawSentence.trim();

    if (!sentence) {
      continue;
    }

    const fingerprint = getSentenceFingerprint(sentence);

    if (fingerprint.length >= LONG_SENTENCE_FINGERPRINT_MIN_LENGTH && seen.has(fingerprint)) {
      continue;
    }

    if (fingerprint.length >= LONG_SENTENCE_FINGERPRINT_MIN_LENGTH) {
      seen.add(fingerprint);
    }

    result.push(sentence);
  }

  return result.join(" ");
}

export function normalizeCaseTaskDisplayText(value) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.replace(/\r\n?/g, "\n").trim();

  if (!normalized) {
    return "";
  }

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => compactDuplicatedLongSentences(paragraph))
    .filter(Boolean)
    .join("\n\n");
}
