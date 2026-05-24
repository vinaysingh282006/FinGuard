const lucide = require('lucide-react');

const checkList = [
  'Zap', 'X', 'Send', 'Terminal', 'Brain', 'Volume2', 'VolumeX', 
  'Play', 'ChevronRight', 'AlertCircle', 'Fingerprint', 'FileText', 
  'HelpCircle', 'Sparkles', 'CheckCircle2', 'History', 'RotateCcw'
];

console.log("Checking Lucide Icons:");
checkList.forEach(name => {
  const icon = lucide[name];
  console.log(`${name}: ${icon ? 'EXISTS' : 'MISSING'}`);
});
