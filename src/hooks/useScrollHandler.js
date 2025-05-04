import { useEffect, useState } from 'react';

/**
 * Hook personalizado para monitorar a necessidade de rolagem e adicionar controles
 */
export function useScrollHandler(response, responseSectionRef) {
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  useEffect(() => {
    if (response && responseSectionRef.current) {
      const el = responseSectionRef.current;

      const checkScrollNeeded = () => {
        setShowScrollIndicator(el.scrollHeight > el.clientHeight);
      };

      checkScrollNeeded();
      
      // Revalidar quando a janela for redimensionada
      window.addEventListener('resize', checkScrollNeeded);

      return () => {
        window.removeEventListener('resize', checkScrollNeeded);
      };
    } else {
      setShowScrollIndicator(false);
    }
  }, [response, responseSectionRef]);

  useEffect(() => {
    if (response && responseSectionRef.current) {
      const el = responseSectionRef.current;

      const handleWheel = (e) => {
        if (el.scrollHeight > el.clientHeight) {
          // Previne a propagação quando o elemento tem conteúdo que pode ser rolado
          e.stopPropagation();
        }
      };

      el.addEventListener('wheel', handleWheel);

      return () => {
        el.removeEventListener('wheel', handleWheel);
      };
    }
  }, [response, responseSectionRef]);

  return showScrollIndicator;
}