import { Fragment, type ReactNode } from "react";

// A small, self-contained markdown renderer for the assistant's chat output.
// Handles the subset the agent actually emits — paragraphs, numbered and
// bulleted lists, headings, and inline **bold** / *italic* / `code` — and
// styles it in the Attaché analog aesthetic (calm brass list numbers, no
// heavy dependency, no dangerouslySetInnerHTML).

type Block =
  | { kind: "ol"; items: { num: string; text: string }[] }
  | { kind: "ul"; items: string[] }
  | { kind: "h"; level: number; text: string }
  | { kind: "table"; header: string[]; rows: string[][] }
  | { kind: "hr" }
  | { kind: "p"; text: string };

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

const isTableSep = (s: string) => /^[\s|:-]+$/.test(s) && s.includes("-") && s.includes("|");

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push({ kind: "p", text: para.join(" ") });
      para = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    if (!line.trim()) {
      flushPara();
      continue;
    }

    // GFM pipe table: a row with pipes followed by a |---|---| separator
    if (line.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      flushPara();
      const header = splitRow(line);
      i += 2; // consume header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      i--; // for-loop will increment
      blocks.push({ kind: "table", header, rows });
      continue;
    }

    // horizontal rule
    if (/^(\s*[-*_]){3,}\s*$/.test(line) && !line.includes("|")) {
      flushPara();
      blocks.push({ kind: "hr" });
      continue;
    }

    const ol = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    const ul = line.match(/^\s*[-*•]\s+(.*)$/);
    const h = line.match(/^\s*(#{1,6})\s+(.*)$/);

    if (ol) {
      flushPara();
      const last = blocks[blocks.length - 1];
      if (last && last.kind === "ol") last.items.push({ num: ol[1], text: ol[2] });
      else blocks.push({ kind: "ol", items: [{ num: ol[1], text: ol[2] }] });
    } else if (ul) {
      flushPara();
      const last = blocks[blocks.length - 1];
      if (last && last.kind === "ul") last.items.push(ul[1]);
      else blocks.push({ kind: "ul", items: [ul[1]] });
    } else if (h) {
      flushPara();
      blocks.push({ kind: "h", level: h[1].length, text: h[2] });
    } else {
      para.push(line.trim());
    }
  }

  flushPara();
  return blocks;
}

// Inline: **bold**, *italic* / _italic_, `code`. Bold is matched before
// italic so the alternation resolves correctly.
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_|`([^`]+)`)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      nodes.push(
        <Fragment key={`${keyPrefix}-t-${i}`}>{text.slice(lastIndex, m.index)}</Fragment>
      );
    }
    if (m[2] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-b-${i}`}>{m[2]}</strong>);
    } else if (m[3] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-i-${i}`}>{m[3]}</em>);
    } else if (m[4] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-u-${i}`}>{m[4]}</em>);
    } else if (m[5] !== undefined) {
      nodes.push(
        <code className="md-code" key={`${keyPrefix}-c-${i}`}>
          {m[5]}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
    i++;
  }
  if (lastIndex < text.length) {
    nodes.push(<Fragment key={`${keyPrefix}-t-end`}>{text.slice(lastIndex)}</Fragment>);
  }
  return nodes;
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks = parseBlocks(text);

  return (
    <div className={className ? `md ${className}` : "md"}>
      {blocks.map((block, bi) => {
        const k = `b${bi}`;
        switch (block.kind) {
          case "ol":
            return (
              <ol className="md-ol" key={k}>
                {block.items.map((it, idx) => (
                  <li className="md-li" key={`${k}-${idx}`}>
                    <span className="md-num">{it.num}.</span>
                    <span className="md-li-body">{renderInline(it.text, `${k}-${idx}`)}</span>
                  </li>
                ))}
              </ol>
            );
          case "ul":
            return (
              <ul className="md-ul" key={k}>
                {block.items.map((it, idx) => (
                  <li className="md-li" key={`${k}-${idx}`}>
                    <span className="md-bullet" aria-hidden="true">
                      ▸
                    </span>
                    <span className="md-li-body">{renderInline(it, `${k}-${idx}`)}</span>
                  </li>
                ))}
              </ul>
            );
          case "table":
            return (
              <div className="md-table-wrap" key={k}>
                <table className="md-table">
                  <thead>
                    <tr>
                      {block.header.map((h, hi) => (
                        <th key={hi}>{renderInline(h, `${k}-h${hi}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((c, ci) => (
                          <td key={ci}>{renderInline(c, `${k}-r${ri}c${ci}`)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "hr":
            return <hr className="md-hr" key={k} />;
          case "h":
            return (
              <p className="md-h" key={k}>
                {renderInline(block.text, k)}
              </p>
            );
          default:
            return (
              <p className="md-p" key={k}>
                {renderInline(block.text, k)}
              </p>
            );
        }
      })}
    </div>
  );
}
