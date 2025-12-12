import { useEffect } from 'react';

/**
 * Global hook to ensure input fields scroll into view when focused,
 * especially useful on mobile devices where the keyboard might hide them.
 */
export const useMobileAutoScroll = () => {
  useEffect(() => {
    const handleFocus = (e) => {
      const target = e.target;
      if (!target) return;
      
      const tagName = target.tagName.toLowerCase();
      // Check for inputs, textareas, or selects
      if (['input', 'textarea', 'select'].includes(tagName)) {
         
         const scroll = () => {
             // Check if element is still in document and focused
             if (document.contains(target)) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
             }
         };

         // Multi-stage scroll to account for keyboard animation lag
         setTimeout(scroll, 100);
         setTimeout(scroll, 300);
         setTimeout(scroll, 500); 
      }
    };
    
    // Capture phase 'true' or just 'focusin' which bubbles
    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, []);
};
