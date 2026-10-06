'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  return (
    <div className="prose prose-invert max-w-none text-neutral-300 text-xs md:text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white pb-2 mb-4 border-b border-white/[0.08]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold tracking-tight text-white mt-6 mb-3 pb-1 border-b border-white/[0.05]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-neutral-200 mt-4 mb-2">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-3 text-neutral-300">{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-neutral-300">{children}</li>,
          code: ({ inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code className="px-1.5 py-0.5 rounded-md bg-white/[0.08] text-pink-300 font-mono text-[11px]">
                  {children}
                </code>
              );
            }
            return (
              <div className="my-3 rounded-2xl bg-black/70 border border-white/[0.08] p-3 overflow-x-auto">
                <code className="text-neutral-200 font-mono text-xs">{children}</code>
              </div>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-blue-500/50 pl-3 italic text-neutral-400 my-2">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="w-full text-left border-collapse text-xs border border-white/[0.08]">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="p-2 bg-white/[0.04] border border-white/[0.08] font-semibold text-neutral-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="p-2 border border-white/[0.08] text-neutral-300">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
