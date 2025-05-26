// Google Analytics initialization
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-1CLC4VX76Q');

// Common event tracking function
function trackUIClick(label, target = null, elementType) {
  gtag('event', 'ui_click', {
    'event_label': label,
    'target': target,
    'element_type': elementType
  });
} 