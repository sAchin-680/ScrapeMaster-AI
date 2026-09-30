import { describe, expect, it } from 'vitest';
import {
  mergeSuggestions,
  parseAmazonSuggestions,
  parseFlipkartSuggestions,
  parseGoogleSuggestions,
} from '@/lib/suggest/parse';

describe('suggestion parsers', () => {
  it('reads Flipkart query suggestions and skips rich widgets', () => {
    const body = {
      RESPONSE: {
        suggestions: [
          {
            type: 'AUTOSUGGEST_QUERY_STORE_WIDGET',
            data: { component: { value: { query: 'air fryer' } } },
          },
          {
            type: 'AUTOSUGGEST_RICH_WIDGET',
            data: { component: { value: { title: 'Air Fryers : Healthy' } } },
          },
          {
            type: 'AUTOSUGGEST_QUERY_WIDGET',
            data: { component: { value: { query: 'Air Fryer  Philips' } } },
          },
        ],
      },
    };
    expect(parseFlipkartSuggestions(body)).toEqual(['air fryer', 'air fryer philips']);
  });

  it('reads Amazon keyword suggestions', () => {
    const body = {
      suggestions: [
        { type: 'KEYWORD', value: 'air fryer' },
        { type: 'WIDGET', value: 'ignored' },
        { type: 'KEYWORD', value: 'air fryer oven' },
      ],
    };
    expect(parseAmazonSuggestions(body)).toEqual(['air fryer', 'air fryer oven']);
  });

  it('drops non-shopping Google suggestions', () => {
    const body = [
      'air fr',
      ['air fryer', 'air france', 'air fryer recipes', 'air fryer philips'],
    ];
    expect(parseGoogleSuggestions(body)).toEqual(['air fryer', 'air fryer philips']);
  });

  it('tolerates unexpected shapes', () => {
    expect(parseFlipkartSuggestions(null)).toEqual([]);
    expect(parseAmazonSuggestions('oops')).toEqual([]);
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
