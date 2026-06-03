const WEEKLY_GOAL_KEY = 'nextstep-weekly-goal';

export function loadWeeklyGoal(): number {
  try {
    const data = localStorage.getItem(WEEKLY_GOAL_KEY);
    return data ? JSON.parse(data) : 10;
  } catch {
    return 10;
  }
}

export function saveWeeklyGoal(goal: number): void {
  localStorage.setItem(WEEKLY_GOAL_KEY, JSON.stringify(goal));
}
