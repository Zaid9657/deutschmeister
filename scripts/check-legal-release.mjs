import {
  missingLegalFacts,
  missingPrivacyFacts,
} from '../astro-site/src/data/legal.js';

const legalMissing = missingLegalFacts();
const privacyMissing = missingPrivacyFacts();

if (legalMissing.length === 0 && privacyMissing.length === 0) {
  console.log('Legal release gate passed: operator, privacy, and review evidence are recorded.');
  process.exit(0);
}

console.error('Legal release gate is blocked. Supply verified facts in astro-site/src/data/legal.js:');
for (const key of [...new Set([...legalMissing, ...privacyMissing])]) {
  console.error(`- ${key}`);
}
console.error('Keep the legal pages marked draft/noindex until this check passes.');
process.exit(1);

