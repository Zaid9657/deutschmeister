/**
 * Single source of truth for facts that appear on the legal pages.
 *
 * Empty values are intentional release blockers. Fill them only from operator
 * records; never infer them from a domain, email address, or billing account.
 * Run `npm run check:legal-release` before removing the draft notices/noindex.
 */
export const LEGAL = {
  operator: {
    kind: '', // 'individual' | 'legal-entity'
    name: '',
    legalForm: '',
    representative: '',
    street: '',
    postalCode: '',
    city: '',
    country: '',
    email: 'zaid@deutsch-meister.de',
    phone: '',
    registerName: '',
    registerNumber: '',
    registerApplies: null,
    vatId: '',
    vatIdApplies: null,
    licensedActivityApplies: null,
    supervisoryAuthority: '',
    regulatedProfessionApplies: null,
    chamber: '',
    professionalTitle: '',
    professionalTitleCountry: '',
    professionalRulesUrl: '',
  },
  editorial: {
    applies: null,
    responsibleName: '',
    sameAddressAsOperator: true,
    address: '',
  },
  disputeResolution: {
    participation: 'not-participating',
    employeeCountVerifiedAt: '',
  },
  verification: {
    operatorFactsVerifiedAt: '',
    privacyServicesVerifiedAt: '',
    legalReviewCompletedAt: '',
  },
};

const present = (value) => typeof value === 'string' && value.trim().length > 0;

export const missingLegalFacts = () => {
  const missing = [];
  const required = [
    ['operator.kind', LEGAL.operator.kind],
    ['operator.name', LEGAL.operator.name],
    ['operator.street', LEGAL.operator.street],
    ['operator.postalCode', LEGAL.operator.postalCode],
    ['operator.city', LEGAL.operator.city],
    ['operator.country', LEGAL.operator.country],
    ['verification.operatorFactsVerifiedAt', LEGAL.verification.operatorFactsVerifiedAt],
    ['verification.legalReviewCompletedAt', LEGAL.verification.legalReviewCompletedAt],
  ];

  for (const [key, value] of required) {
    if (!present(value)) missing.push(key);
  }

  if (LEGAL.operator.kind === 'legal-entity') {
    if (!present(LEGAL.operator.legalForm)) missing.push('operator.legalForm');
    if (!present(LEGAL.operator.representative)) missing.push('operator.representative');
  }
  for (const key of ['registerApplies', 'vatIdApplies', 'licensedActivityApplies', 'regulatedProfessionApplies']) {
    if (LEGAL.operator[key] === null) missing.push(`operator.${key}`);
  }
  if (LEGAL.operator.registerApplies === true) {
    if (!present(LEGAL.operator.registerName)) missing.push('operator.registerName');
    if (!present(LEGAL.operator.registerNumber)) missing.push('operator.registerNumber');
  }
  if (LEGAL.operator.vatIdApplies === true && !present(LEGAL.operator.vatId)) {
    missing.push('operator.vatId');
  }
  if (LEGAL.operator.licensedActivityApplies === true && !present(LEGAL.operator.supervisoryAuthority)) {
    missing.push('operator.supervisoryAuthority');
  }
  if (LEGAL.operator.regulatedProfessionApplies === true) {
    for (const key of ['chamber', 'professionalTitle', 'professionalTitleCountry', 'professionalRulesUrl']) {
      if (!present(LEGAL.operator[key])) missing.push(`operator.${key}`);
    }
  }

  if (LEGAL.editorial.applies === null) missing.push('editorial.applies');
  if (LEGAL.editorial.applies === true && !present(LEGAL.editorial.responsibleName)) {
    missing.push('editorial.responsibleName');
  }
  if (!present(LEGAL.disputeResolution.employeeCountVerifiedAt)) {
    missing.push('disputeResolution.employeeCountVerifiedAt');
  }

  return missing;
};

export const missingPrivacyFacts = () => {
  const missing = missingLegalFacts();
  if (!present(LEGAL.verification.privacyServicesVerifiedAt)) {
    missing.push('verification.privacyServicesVerifiedAt');
  }
  return [...new Set(missing)];
};

export const isLegalReleaseReady = missingLegalFacts().length === 0;
export const isPrivacyReleaseReady = missingPrivacyFacts().length === 0;
