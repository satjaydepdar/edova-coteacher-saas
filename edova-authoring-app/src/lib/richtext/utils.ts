export function richTextToPlain(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent ?? '').trim()
}

export function isRichTextEmpty(html: string): boolean {
  return !richTextToPlain(html)
}
