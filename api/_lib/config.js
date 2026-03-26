export const PLANS = {
  starter: { price: 250, hours: 8, currency: 'cad', amount: 25000 },
  professional: { price: 400, hours: 16, currency: 'cad', amount: 40000 },
};

export const ENGLISH_PLANS = {
  flexible: { price: 160, hours: 8, currency: 'usd' },
  standard: { price: 300, hours: 16, currency: 'usd' },
};

// Used by webhook/complete-registration for subscription creation
export const WEBHOOK_PLANS = {
  starter: { price: 160, hours: 8 },
  professional: { price: 288, hours: 16 },
};
