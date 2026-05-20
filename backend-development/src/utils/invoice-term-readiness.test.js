const { arePreviousTermsPaid } = require('./invoice-term-readiness');

describe('arePreviousTermsPaid', () => {
  const terms = [
    { term_order: 1, status: 'PAID' },
    { term_order: 2, status: 'PAID' },
    { term_order: 3, status: 'DRAFT' },
    { term_order: 4, status: 'DRAFT' }
  ];

  it('returns true when all lower term_order are PAID', () => {
    expect(arePreviousTermsPaid(terms, { term_order: 3 })).toBe(true);
    expect(arePreviousTermsPaid(terms, { term_order: 4 })).toBe(false);
  });

  it('returns true when there are no previous terms', () => {
    expect(arePreviousTermsPaid(terms, { term_order: 1 })).toBe(true);
  });

  it('returns false when any previous term is not PAID', () => {
    const mixed = [
      { term_order: 1, status: 'PAID' },
      { term_order: 2, status: 'SENT' },
      { term_order: 3, status: 'DRAFT' }
    ];
    expect(arePreviousTermsPaid(mixed, { term_order: 3 })).toBe(false);
  });
});
