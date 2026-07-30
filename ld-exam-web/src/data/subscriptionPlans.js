// Single source of truth for subscription tiers, pricing, and feature limits.
export const PLANS = [
  {
    key: 'advanced', label: 'Advanced', color: '#4338ca', price: 599,
    tagline: 'Adaptive practice + AI recommendations',
    limits: {
      practiceCategories: ['phonics', 'reading', 'writing', 'math'],
      maxTestLevel: 4,
      certification: true,
      recommendations: true,
    },
  },
  {
    key: 'pro', label: 'Pro', color: '#a16207', price: 999,
    tagline: 'Full access, AI tutor + priority support',
    limits: {
      practiceCategories: 'all',
      maxTestLevel: 5,
      certification: true,
      recommendations: true,
    },
  },
];

export const getPlan = (key) => PLANS.find((p) => p.key === key) || PLANS[0];

export const isCategoryUnlocked = (planKey, categoryKey) => {
  const { practiceCategories } = getPlan(planKey).limits;
  return practiceCategories === 'all' || practiceCategories.includes(categoryKey);
};

export const maxUnlockedLevel = (planKey) => getPlan(planKey).limits.maxTestLevel;
