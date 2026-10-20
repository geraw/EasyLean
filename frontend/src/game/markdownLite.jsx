import React from 'react';
import { isolateFormulas } from './bidi';

// Very small markdown-ish renderer: blank-line-separated paragraphs,
// "# " headings, `code` spans, **bold** and *emphasis*.
const renderInline = (text, keyPrefix) => {
    return text.split('`').map((chunk, i) => {
        if (i % 2 === 1) {
            return (
                <code key={`${keyPrefix}-c${i}`} style={{ background: '#e8e8e8', padding: '1px 5px', borderRadius: 3, direction: 'ltr', display: 'inline-block', fontSize: '0.95em' }}>
                    {chunk}
                </code>
            );
        }
        return isolateFormulas(chunk).split(/(\*\*.+?\*\*|\*.+?\*)/g).map((seg, j) => {
            if (seg.startsWith('**') && seg.endsWith('**') && seg.length > 4) return <strong key={`${keyPrefix}-b${i}-${j}`}>{seg.slice(2, -2)}</strong>;
            if (seg.startsWith('*') && seg.endsWith('*') && seg.length > 2) return <em key={`${keyPrefix}-i${i}-${j}`}>{seg.slice(1, -1)}</em>;
            return <React.Fragment key={`${keyPrefix}-t${i}-${j}`}>{seg}</React.Fragment>;
        });
    });
};

export const renderMarkdownLite = (text) => {
    return text.trim().split(/\n\s*\n/).map((block, idx) => {
        const trimmed = block.trim();
        if (trimmed.startsWith('# ')) {
            return <h3 key={idx} style={{ margin: '0 0 8px 0' }}>{renderInline(trimmed.slice(2), `h${idx}`)}</h3>;
        }
        return <p key={idx} style={{ margin: '0 0 10px 0', lineHeight: 1.6 }}>{renderInline(trimmed, `p${idx}`)}</p>;
    });
};
