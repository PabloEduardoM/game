-- Seed de exemplo para RPG 2D Online MVP
INSERT INTO users (email, username) VALUES ('hero@example.com', 'Hero1') ON CONFLICT DO NOTHING;

INSERT INTO characters (user_id, username, level, xp, gold, x, y, inventory)
VALUES (
  (SELECT id FROM users WHERE username = 'Hero1'),
  'Hero1',
  1,
  0,
  12,
  80,
  80,
  '[]'
) ON CONFLICT (username) DO NOTHING;

INSERT INTO items (label, description, value, sprite) VALUES
('Gema', 'Uma gema brilhante necessária para a missão.', 5, 'gem'),
('Espada de madeira', 'Uma espada simples para iniciantes.', 10, 'sword')
ON CONFLICT DO NOTHING;
