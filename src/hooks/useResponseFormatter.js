import { useEffect, useState } from 'react';

/**
 * Hook personalizado para processar e formatar respostas de APIs
 * que contêm blocos de código markdown
 */
export function useResponseFormatter(response) {
  const [formattedResponse, setFormattedResponse] = useState([]);

  useEffect(() => {
    if (!response) {
      setFormattedResponse([]);
      return;
    }

    const codeBlockRegex = /```(?:(\w+)(?: ?([^\n]+))?)?(?:\n)([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(response)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: response.substring(lastIndex, match.index)
        });
      }

      let language = match[1] ? match[1].toLowerCase() : 'javascript';

      const languageMap = {
        'js': 'javascript',
        'ts': 'typescript',
        'py': 'python',
        'rb': 'ruby',
        'kt': 'kotlin',
        'cpp': 'cpp',
        'c++': 'cpp',
        'cs': 'csharp',
        'java': 'java',
        'go': 'go',
        'php': 'php',
        'sh': 'bash',
        'bash': 'bash',
        'shell': 'bash',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'xml': 'xml',
        'yaml': 'yaml',
        'yml': 'yaml',
        'md': 'markdown',
        'markdown': 'markdown',
        'sql': 'sql'
      };

      language = languageMap[language] || language;

      parts.push({
        type: 'code',
        language: language,
        title: match[2] || '',
        content: match[3]
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < response.length) {
      parts.push({
        type: 'text',
        content: response.substring(lastIndex)
      });
    }

    setFormattedResponse(parts);
  }, [response]);

  return formattedResponse;
}