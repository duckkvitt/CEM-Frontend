import React from 'react'

interface MarkdownViewProps {
  content: string
}

// Very lightweight Markdown renderer: supports headings (##, ###), bullet/numbered lists,
// bold (**text**), italic (*text*), inline code (`code`), and links [text](url).
export function MarkdownView({ content }: MarkdownViewProps) {
  const lines = content.split(/\r?\n/)

  const elements: React.ReactNode[] = []
  let listBuffer: { type: 'ul' | 'ol'; items: string[] } | null = null

  function flushList() {
    if (!listBuffer) return
    const items = listBuffer.items.map((item, idx) => (
      <li key={`li-${elements.length}-${idx}`}>{inlineFormat(item)}</li>
    ))
    if (listBuffer.type === 'ul') elements.push(<ul className="list-disc ml-5 my-2" key={`ul-${elements.length}`}>{items}</ul>)
    else elements.push(<ol className="list-decimal ml-5 my-2" key={`ol-${elements.length}`}>{items}</ol>)
    listBuffer = null
  }

  function inlineFormat(text: string): React.ReactNode {
    // code
    const codeParts = text.split(/`([^`]+)`/g)
    const codeNodes = codeParts.map((part, i) => {
      if (i % 2 === 1) return <code key={`code-${i}`} className="px-1 py-0.5 rounded bg-muted text-xs">{part}</code>
      return part
    })

    // bold and italic and links on the resulting nodes where strings
    function formatNode(node: React.ReactNode, keyBase: string): React.ReactNode {
      if (typeof node !== 'string') return node

      // links
      const linkParts = node.split(/(\[[^\]]+\]\([^\)]+\))/g)
      const linkNodes = linkParts.map((lp, li) => {
        const m = lp.match(/^\[([^\]]+)\]\(([^\)]+)\)$/)
        if (m) {
          const [, text, url] = m
          return <a key={`${keyBase}-a-${li}`} href={url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-700">{text}</a>
        }
        return lp
      })

      // bold
      const boldNodes = ([] as React.ReactNode[]).concat(...linkNodes.map((ln, bi) => {
        if (typeof ln !== 'string') return [ln]
        return ln.split(/(\*\*[^*]+\*\*)/g).map((bp, bj) => {
          const bm = bp.match(/^\*\*([^*]+)\*\*$/)
          if (bm) return <strong key={`${keyBase}-b-${bi}-${bj}`}>{bm[1]}</strong>
          return bp
        })
      }))

      // italic
      const italicNodes = ([] as React.ReactNode[]).concat(...boldNodes.map((bn, ii) => {
        if (typeof bn !== 'string') return [bn]
        return bn.split(/(\*[^*]+\*)/g).map((ip, ij) => {
          const im = ip.match(/^\*([^*]+)\*$/)
          if (im) return <em key={`${keyBase}-i-${ii}-${ij}`}>{im[1]}</em>
          return ip
        })
      }))

      return italicNodes
    }

    // apply formatting to each node
    return codeNodes.map((n, idx) => formatNode(n, `inline-${idx}`))
  }

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd()

    // empty line
    if (line.trim() === '') {
      flushList()
      elements.push(<div key={`sp-${idx}`} className="h-2" />)
      return
    }

    // headings
    if (line.startsWith('### ')) {
      flushList()
      elements.push(<h3 key={`h3-${idx}`} className="font-semibold text-base mt-3">{inlineFormat(line.slice(4))}</h3>)
      return
    }
    if (line.startsWith('## ')) {
      flushList()
      elements.push(<h2 key={`h2-${idx}`} className="font-semibold text-lg mt-4">{inlineFormat(line.slice(3))}</h2>)
      return
    }

    // lists
    const ulMatch = line.match(/^\-\s+(.*)$/)
    if (ulMatch) {
      const item = ulMatch[1]
      if (listBuffer && listBuffer.type === 'ul') listBuffer.items.push(item)
      else {
        flushList()
        listBuffer = { type: 'ul', items: [item] }
      }
      return
    }
    const olMatch = line.match(/^(\d+)\.\s+(.*)$/)
    if (olMatch) {
      const item = olMatch[2]
      if (listBuffer && listBuffer.type === 'ol') listBuffer.items.push(item)
      else {
        flushList()
        listBuffer = { type: 'ol', items: [item] }
      }
      return
    }

    // paragraph
    flushList()
    elements.push(<p key={`p-${idx}`} className="leading-relaxed">{inlineFormat(line)}</p>)
  })

  // flush any pending list
  flushList()

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {elements}
    </div>
  )
}

export default MarkdownView

