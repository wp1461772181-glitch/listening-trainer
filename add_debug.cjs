// Quick test: does the auth page render and does the form submit work?
// Let's add console.log debugging to the AuthForm

const fs = require('fs');
const path = require('path');

const authFormPath = path.join(__dirname, 'src/components/AuthForm.tsx');
let content = fs.readFileSync(authFormPath, 'utf8');

// Add debug logging
content = content.replace(
  'const handleSubmit = async (e: React.FormEvent) => {',
  `const handleSubmit = async (e: React.FormEvent) => {
    console.log('[AuthForm] handleSubmit called');`
);

content = content.replace(
  "e.preventDefault();",
  `e.preventDefault();
    console.log('[AuthForm] default prevented, email:', email, 'isRegister:', isRegister);`
);

content = content.replace(
  "const { error: err } = isRegister",
  `console.log('[AuthForm] calling signIn/signUp...');
    const { error: err } = isRegister`
);

content = content.replace(
  "setSubmitting(false);",
  `console.log('[AuthForm] submit finished, error:', err);
    setSubmitting(false);`
);

fs.writeFileSync(authFormPath, content);
console.log('Added debug logging to AuthForm.tsx');
