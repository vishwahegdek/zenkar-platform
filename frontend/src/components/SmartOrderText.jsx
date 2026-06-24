import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * SmartOrderText takes a raw string, detects order identifiers (like ORD-1052 or #1052),
 * and turns them into clickable links that route to the specific order page.
 */
export default function SmartOrderText({ text, className = "" }) {
  const navigate = useNavigate();

  if (!text) return null;

  // Regex to match "ORD-123" (case insensitive) or "#123"
  const orderPattern = /(ORD-\d+|#\d+)/gi;
  
  // Split the text by the pattern. 
  // Wrapping the pattern in () ensures the matched string is included in the resulting array.
  const parts = String(text).split(orderPattern);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.match(orderPattern)) {
          // Clean the identifier: if it's "#123", we route to "123". If "ORD-123", keep it as "ORD-123".
          const cleanId = part.startsWith('#') ? part.substring(1) : part.toUpperCase();
          
          return (
            <span
              key={index}
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering parent clicks (like row clicks)
                navigate(`/orders/${cleanId}`);
              }}
              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
              title={`View Order ${part}`}
            >
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
