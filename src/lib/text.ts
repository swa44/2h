/** 받침 유무로 조사 선택: josa("지은", "와", "과") → "지은과" */
export function josa(word: string, noBatchim: string, batchim: string) {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return word + noBatchim;
  return word + ((code - 0xac00) % 28 ? batchim : noBatchim);
}
