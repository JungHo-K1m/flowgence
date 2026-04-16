/**
 * 프로젝트 설명에서 파일명 섹션을 제거하고 사용자 코멘트만 추출한다.
 */
export function extractPureComment(description: string): string {
  return description.replace(/\n\n\[업로드된 파일\]\n[\s\S]*$/, '').trim();
}

/**
 * 사용자 코멘트와 파일 내용을 결합하여 API 요청용 설명을 생성한다.
 * UI에는 파일명만 표시되지만 API에는 전체 파일 내용을 포함한다.
 */
export function buildDescriptionWithFileContents(
  description: string,
  fileContents: string,
): string {
  const pureComment = extractPureComment(description);

  if (!fileContents) return pureComment;

  return pureComment
    ? `${pureComment}\n\n[업로드된 파일 내용]\n${fileContents}`
    : `[업로드된 파일 내용]\n${fileContents}`;
}

/**
 * 사용자 코멘트 + 파일명을 조합하여 UI 표시용 프로젝트 설명을 생성한다.
 */
export function buildDisplayDescription(
  comment: string,
  fileNames: string,
): string {
  if (!fileNames) return comment;

  const fileNamesWithIcon = fileNames
    .split('\n')
    .filter(name => name.trim())
    .map(name => `📄 ${name}`)
    .join('\n');

  return comment.trim()
    ? `${comment}\n\n[업로드된 파일]\n${fileNamesWithIcon}`
    : `[업로드된 파일]\n${fileNamesWithIcon}`;
}

/**
 * 복원된 설명 텍스트에서 파일명 부분을 분리한다.
 * @returns [pureComment, fileNames]
 */
export function splitDescriptionAndFileNames(
  description: string,
): [string, string] {
  const fileSectionRegex = /\n\n\[업로드된 파일\]\n([\s\S]*)$/;
  const match = description.match(fileSectionRegex);

  if (!match) return [description, ''];

  const fileNames = match[1]
    .trim()
    .split('\n')
    .map(name => name.replace(/^📄\s*/, '').trim())
    .filter(name => name)
    .join('\n');

  const pureComment = description.replace(fileSectionRegex, '').trim();
  return [pureComment, fileNames];
}
