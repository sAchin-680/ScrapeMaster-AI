import { describe, expect, it } from 'vitest';
import { mergeSuggestions, parseGoogleSuggestions } from '@/lib/suggest/parse';

describe('suggestion parsers', () => {
  it('drops non-shopping Google suggestions', () => {
    const body = [
      'air fr',
      ['air fryer', 'air france', 'air fryer recipes', 'air fryer philips'],
    ];
    expect(parseGoogleSuggestions(body)).toEqual(['air fryer', 'air fryer philips']);
  });

  it('tolerates unexpected shapes', () => {
    expect(parseGoogleSuggestions(null)).toEqual([]);
    expect(parseGoogleSuggestions({})).toEqual([]);
  });

  it('merges in priority order without duplicates or the query itself', () => {
    expect(
      mergeSuggestions(
        'air fryer',
        [
          ['air fryer', 'air fryer oven'],
          ['air fryer oven', 'air fryer philips'],
        ],
        3,
      ),
    ).toEqual(['air fryer oven', 'air fryer philips']);
  });
});
