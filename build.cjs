const fs = require('fs');
let html = fs.readFileSync('dashboard_generated.html', 'utf8');

let bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
if (bodyMatch) {
  let jsx = bodyMatch[1];
  jsx = jsx.replace(/<script>[\s\S]*?<\/script>/g, '');
  jsx = jsx.replace(/<!--[\s\S]*?-->/g, '');
  jsx = jsx.replace(/class="/g, 'className="');
  jsx = jsx.replace(/viewbox="/g, 'viewBox="');
  jsx = jsx.replace(/stroke-width="/g, 'strokeWidth="');
  jsx = jsx.replace(/stroke-dasharray="/g, 'strokeDasharray="');
  jsx = jsx.replace(/stroke-dashoffset="/g, 'strokeDashoffset="');
  jsx = jsx.replace(/fill-rule="/g, 'fillRule="');
  jsx = jsx.replace(/preserveaspectratio="/g, 'preserveAspectRatio="');
  jsx = jsx.replace(/stop-color="/g, 'stopColor="');
  
  // Clean up self-closing tags (only inputs and imgs)
  jsx = jsx.replace(/<input([^>]*?)>/g, (match, p1) => {
      if (p1.endsWith('/')) return match;
      return '<input' + p1 + ' />';
  });
  jsx = jsx.replace(/<img([^>]*?)>/g, (match, p1) => {
      if (p1.endsWith('/')) return match;
      return '<img' + p1 + ' />';
  });

  // Replace style="color: #00d68f" with style={{ color: '#00d68f' }}
  jsx = jsx.replace(/style="color:\s*(#[a-fA-F0-9]+)"/g, "style={{ color: '$1' }}");

  // Wrap in App component
  let appCode = `import React, { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    function animateCounter(id, target) {
        const el = document.getElementById(id);
        if (!el) return;
        let current = target * 0.95;
        const increment = (target - current) / 60;
        const timer = setInterval(() => {
            current += increment;
            el.innerText = Math.floor(current).toLocaleString();
            if (current >= target) {
                el.innerText = target.toLocaleString();
                clearInterval(timer);
            }
        }, 20);
    }

    animateCounter('count-tx', 1248302);
    
    const interval = setInterval(() => {
        const indicators = document.querySelectorAll('.status-pulse');
        if(indicators.length === 0) return;
        const random = Math.floor(Math.random() * indicators.length);
        indicators[random].style.transform = 'scale(1.2)';
        setTimeout(() => {
            indicators[random].style.transform = 'scale(1)';
        }, 200);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-body-md text-body-md mesh-gradient text-on-surface bg-background min-h-screen">
${jsx}
    </div>
  );
}
`;
  fs.writeFileSync('src/App.jsx', appCode);
}
console.log('Done');
