use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ScoringInput {
    pub annual_income: u64,
    pub total_debt: u64,
    pub months_on_time_payments: u16,
    pub credit_utilization_pct: u8,
}

/// Deterministic rules-based score in the 300–850 range (integer math only).
pub fn compute_score(input: &ScoringInput) -> u32 {
    let mut score: i64 = 400;

    score += (input.annual_income / 1_000).min(200) as i64;
    score -= (input.total_debt / 500).min(150) as i64;
    score += (input.months_on_time_payments as i64 * 2).min(120);
    score -= input.credit_utilization_pct as i64;

    score.clamp(300, 850) as u32
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn score_is_deterministic() {
        let input = ScoringInput {
            annual_income: 80_000,
            total_debt: 10_000,
            months_on_time_payments: 36,
            credit_utilization_pct: 20,
        };
        assert_eq!(compute_score(&input), compute_score(&input));
    }
}
