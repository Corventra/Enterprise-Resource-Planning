const SUMMARY_MAX_LEN = 100;
const FALLBACK_SUMMARY = 'Tidak ada ringkasan jawaban';

const isFilledAnswer = (fieldType, answerValue, answerFilePath) => {
  if (fieldType === 'file') {
    return Boolean(answerFilePath && String(answerFilePath).trim());
  }
  if (answerValue === null || answerValue === undefined) return false;
  return String(answerValue).trim().length > 0;
};

const truncate = (text, max = SUMMARY_MAX_LEN) => {
  const t = String(text).trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
};

const parseCheckboxValues = (answerValue) => {
  if (answerValue === null || answerValue === undefined) return [];
  const raw = String(answerValue).trim();
  if (!raw) return [];
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v));
    } catch {
      /* fallthrough */
    }
  }
  return [raw];
};

const formatCheckboxSummary = (answerValue, options) => {
  const parts = parseCheckboxValues(answerValue);
  if (parts.length === 0) return FALLBACK_SUMMARY;
  const labelByValue = new Map((options || []).map((o) => [o.value, o.label]));
  const labels = parts.map((v) => labelByValue.get(v) || v);
  return truncate(labels.join(', '));
};

/**
 * Ringkasan list submission: jawaban pertama terisi menurut sort_order field.
 * @param {Array<{ field_type: string, answer_value: string|null, answer_file_path: string|null, options?: Array<{ value: string, label: string }> }>} orderedRows
 */
const buildSummaryFromOrderedAnswers = (orderedRows) => {
  for (const row of orderedRows) {
    const { field_type: fieldType, answer_value: answerValue, answer_file_path: answerFilePath, options } = row;
    if (!isFilledAnswer(fieldType, answerValue, answerFilePath)) continue;
    if (fieldType === 'file') return '1 file diunggah';
    if (fieldType === 'checkbox') return formatCheckboxSummary(answerValue, options);
    return truncate(String(answerValue).trim());
  }
  return FALLBACK_SUMMARY;
};

/**
 * Nilai jawaban untuk detail internal (checkbox → label gabungan).
 */
const formatAnswerDisplayValue = (fieldType, answerValue, options) => {
  if (answerValue === null || answerValue === undefined || String(answerValue).trim() === '') {
    return null;
  }
  if (fieldType === 'checkbox') {
    const parts = parseCheckboxValues(answerValue);
    if (parts.length === 0) return null;
    const labelByValue = new Map((options || []).map((o) => [o.value, o.label]));
    return parts.map((v) => labelByValue.get(v) || v).join(', ');
  }
  return String(answerValue);
};

module.exports = {
  SUMMARY_MAX_LEN,
  FALLBACK_SUMMARY,
  buildSummaryFromOrderedAnswers,
  formatAnswerDisplayValue
};
