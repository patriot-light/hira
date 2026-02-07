from models.enums import EvaluationResult


def calculate_session_result(total_penalty: float, total_pages: int) -> tuple:
    """Calculate the final score and result for a recitation session."""
    if total_pages == 0:
        return 0, EvaluationResult.NEEDS_REVIEW
    
    final_score = max(0, 100 - total_penalty)
    
    if final_score >= 90:
        result = EvaluationResult.EXCELLENT
    elif final_score >= 80:
        result = EvaluationResult.VERY_GOOD
    elif final_score >= 70:
        result = EvaluationResult.GOOD
    else:
        result = EvaluationResult.NEEDS_REVIEW
    
    return final_score, result
