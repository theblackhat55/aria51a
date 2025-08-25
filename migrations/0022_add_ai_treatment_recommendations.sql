-- Add AI treatment recommendations table
CREATE TABLE IF NOT EXISTS ai_treatment_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER,
  user_id INTEGER NOT NULL,
  recommendations TEXT NOT NULL, -- JSON string containing the AI recommendations
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (risk_id) REFERENCES risks(id)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_ai_treatment_recommendations_risk_id ON ai_treatment_recommendations(risk_id);
CREATE INDEX IF NOT EXISTS idx_ai_treatment_recommendations_user_id ON ai_treatment_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_treatment_recommendations_created_at ON ai_treatment_recommendations(created_at);