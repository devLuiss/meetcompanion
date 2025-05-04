import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * Componente para exibir respostas formatadas com suporte a blocos de código
 */
const FormattedResponse = ({ 
  response, 
  formattedResponse, 
  showScrollIndicator,
  responseSectionRef
}) => {
  const [copiedIndex, setCopiedIndex] = useState(null);
  
  if (!response) return null;
  
  /**
   * Copia o texto para a área de transferência
   */
  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    });
  };

  return (
    <div 
      className="flex-1 overflow-auto p-5 flex flex-col outline-none scroll-smooth"
      ref={responseSectionRef}
      tabIndex="0"
      onClick={() => {
        responseSectionRef.current && responseSectionRef.current.focus();
      }}
      onKeyDown={(e) => {
        if (['ArrowUp', 'ArrowDown'].includes(e.key) && responseSectionRef.current) {
          const el = responseSectionRef.current;
          const isModifierPressed = e.metaKey || e.ctrlKey;
          const scrollAmount = isModifierPressed ? 200 : 60;

          if (e.key === 'ArrowUp') {
            el.scrollTop -= scrollAmount;
          } else if (e.key === 'ArrowDown') {
            el.scrollTop += scrollAmount;
          }

          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div 
        className="w-full"
        onClick={(e) => {
          e.stopPropagation();
          responseSectionRef.current && responseSectionRef.current.focus();
        }}
      >
        {formattedResponse.length > 0 ? formattedResponse.map((part, index) => (
          part.type === 'code' ? (
            <div key={`code-${index}`} className="my-5 rounded-md overflow-hidden bg-[#282c34] shadow-md border border-[#383c44]">
              <div className="flex justify-between items-center px-4 py-2 bg-[#21252b] border-b border-[#383c44]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-[#9cdcfe] uppercase">{part.language}</span>
                  {part.title && <span className="text-xs text-[#dcdcaa] pl-3 border-l border-[#3e3e3e]">{part.title}</span>}
                </div>
                <button 
                  className="text-xs py-1 px-3 rounded bg-[#3d424a] text-[#ddd] hover:bg-[#4a4f57] hover:text-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(part.content, index);
                  }}
                >
                  {copiedIndex === index ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <SyntaxHighlighter
                language={part.language}
                style={vscDarkPlus}
                customStyle={{
                  margin: '0',
                  borderRadius: '0 0 4px 4px',
                  fontSize: '13px',
                  maxWidth: '100%',
                  background: 'rgba(30, 30, 30, 0.7)',
                }}
                wrapLongLines={false}
                showLineNumbers={true}
              >
                {part.content}
              </SyntaxHighlighter>
            </div>
          ) : (
            <div key={`text-${index}`} className="mb-5 whitespace-pre-wrap break-words text-content-foreground">
              {part.content.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < part.content.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          )
        )) : null}
      </div>
      {showScrollIndicator && (
        <div className="fixed bottom-5 right-5 bg-bg-primary text-content-primary-foreground px-4 py-2 rounded-md text-sm shadow-lg">
          Scroll for more
        </div>
      )}
    </div>
  );
};

export default FormattedResponse;