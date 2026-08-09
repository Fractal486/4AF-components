"use client";

import { Copy } from "lucide-react";
import { CopyButton } from "@/registry/ui/copy-button/copy-button";

type TokenKind =
  | "comment"
  | "function"
  | "keyword"
  | "number"
  | "operator"
  | "property"
  | "string";

interface Token {
  kind?: TokenKind;
  value: string;
}

const LANGUAGE_ALIASES: Record<string, "shell" | "typescript"> = {
  bash: "shell",
  sh: "shell",
  shell: "shell",
  javascript: "typescript",
  js: "typescript",
  jsx: "typescript",
  ts: "typescript",
  tsx: "typescript",
  typescript: "typescript",
};

const KEYWORDS: Record<"shell" | "typescript", ReadonlySet<string>> = {
  shell: new Set([
    "case",
    "do",
    "done",
    "elif",
    "else",
    "esac",
    "fi",
    "for",
    "function",
    "if",
    "in",
    "then",
    "while",
  ]),
  typescript: new Set([
    "as",
    "async",
    "await",
    "boolean",
    "const",
    "default",
    "else",
    "export",
    "false",
    "from",
    "function",
    "if",
    "import",
    "interface",
    "let",
    "new",
    "null",
    "number",
    "of",
    "return",
    "string",
    "true",
    "type",
    "undefined",
    "unknown",
    "void",
  ]),
};

function pushToken(tokens: Token[], value: string, kind?: TokenKind) {
  if (!value) return;
  const previous = tokens[tokens.length - 1];
  if (previous !== undefined && previous.kind === kind) {
    previous.value += value;
    return;
  }
  tokens.push({ kind, value });
}

function tokenize(code: string, language: string): Token[] {
  const normalized = LANGUAGE_ALIASES[language.toLowerCase()];
  if (!normalized) return [{ value: code }];

  const keywords = KEYWORDS[normalized];
  const tokens: Token[] = [];
  let index = 0;

  while (index < code.length) {
    const rest = code.slice(index);
    const current = code[index];
    if (current === undefined) break;

    if (
      (current === "/" && (code[index + 1] === "/" || code[index + 1] === "*")) ||
      (normalized === "shell" && current === "#")
    ) {
      const block = current === "/" && code[index + 1] === "*";
      const close = block ? code.indexOf("*/", index + 2) : code.indexOf("\n", index);
      const end = close >= 0 ? (block ? close + 2 : close) : code.length;
      pushToken(tokens, code.slice(index, end), "comment");
      index = end;
      continue;
    }

    if (current === '"' || current === "'" || (current === "`" && normalized === "typescript")) {
      let end = index + 1;
      while (end < code.length) {
        if (code[end] === "\\") {
          end += 2;
          continue;
        }
        if (code[end] === current) {
          end += 1;
          break;
        }
        end += 1;
      }
      pushToken(tokens, code.slice(index, end), "string");
      index = end;
      continue;
    }

    const number = /^\b(?:\d+(?:\.\d+)?|0x[\da-f]+)\b/i.exec(rest);
    if (number) {
      pushToken(tokens, number[0], "number");
      index += number[0].length;
      continue;
    }

    const identifier = /^[A-Za-z_$][\w$-]*/.exec(rest);
    if (identifier) {
      const value = identifier[0];
      const after = code.slice(index + value.length);
      const kind: TokenKind | undefined = keywords.has(value)
        ? "keyword"
        : /^\s*\(/.test(after)
          ? "function"
          : normalized !== "shell" && /^\s*:/.test(after)
            ? "property"
            : undefined;
      pushToken(tokens, value, kind);
      index += value.length;
      continue;
    }

    const operator = /^(?:=>|===?|!==?|\?\?|&&|\|\||\+\+|--|\+=|-=|\*=|\/=|[{}()[\].,:;=+*%!?<>|&]|\/)/.exec(rest);
    if (operator) {
      pushToken(tokens, operator[0], "operator");
      index += operator[0].length;
      continue;
    }

    pushToken(tokens, current);
    index += 1;
  }

  return tokens;
}

export function ReferenceCodeBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const tokens = tokenize(code, language);

  return (
    <div className="markdown-code-block" data-language={language}>
      <div className="markdown-code-header">
        <span className="markdown-code-language">{language}</span>
        <CopyButton
          value={code}
          icon={<Copy />}
          aria-label={`Copy ${language} code`}
          labels={{ copy: "Copy", copied: "Copied", failed: "Couldn't copy" }}
          variant="plain"
          size="icon-sm"
          className="markdown-code-copy"
        />
      </div>
      <pre className="markdown-code-content">
        <code className="markdown-code-inline">
          {tokens.map((token, index) => {
            const kind = token.kind;
            return kind ? (
              <span key={`${kind}-${index}`} className={`markdown-token-${kind}`}>
                {token.value}
              </span>
            ) : (
              token.value
            );
          })}
        </code>
      </pre>
    </div>
  );
}
