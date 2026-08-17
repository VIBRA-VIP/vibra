-- Starter credits: clients with empty wallet get 50 free credits
WITH granted AS (
  UPDATE wallets AS w
  SET
    balance = 50,
    updated_at = CURRENT_TIMESTAMP
  FROM users AS u
  WHERE w.user_id = u.id
    AND u.role = 'CLIENT'
    AND w.balance = 0
  RETURNING w.id, w.user_id, w.balance
)
INSERT INTO credit_transactions (
  id,
  wallet_id,
  user_id,
  type,
  amount,
  balance_after,
  description,
  reference_id,
  created_at
)
SELECT
  gen_random_uuid(),
  granted.id,
  granted.user_id,
  'ADMIN_ADJUST',
  50,
  granted.balance,
  'Bienvenida: 50 créditos gratis',
  NULL,
  CURRENT_TIMESTAMP
FROM granted;
