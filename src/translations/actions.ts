export const actionTranslations: Record<string, { name: string; shortName?: string; emoji: string }> = {
  'automatic': { name: 'Generic Event', emoji: '📝' },
  'substitution': { name: 'Substitution', emoji: '🔄' },
  'substitution_opponent': { name: 'Opponent Substitution', shortName: 'Substitution', emoji: '🔄' },
  'yellow_card': { name: 'Yellow Card', emoji: '🟨' },
  'yellow_card_opponent': { name: 'Opponent Yellow Card', shortName: 'Yellow Card', emoji: '🟨' },
  'red_card': { name: 'Red Card', emoji: '🟥' },
  'red_card_opponent': { name: 'Opponent Red Card', shortName: 'Red Card', emoji: '🟥' },
  'goal': { name: 'Goal', emoji: '⚽' },
  'goal_opponent': { name: 'Opponent Goal', shortName: 'Goal', emoji: '⚽' },
  'corner': { name: 'Corner', emoji: '⛳' },
  'corner_opponent': { name: 'Opponent Corner', shortName: 'Corner', emoji: '⛳' }
};