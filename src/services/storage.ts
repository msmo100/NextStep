// Nyckeln som veckomålet lagras under i webbläsarens localStorage.
const WEEKLY_GOAL_KEY = 'nextstep-weekly-goal';

// Läser veckomålet från localStorage. Returnerar 10 som standard om inget sparats
// eller om värdet är trasigt.
export function loadWeeklyGoal(): number {
  try {
    const data = localStorage.getItem(WEEKLY_GOAL_KEY);
    return data ? JSON.parse(data) : 10;
  } catch {
    return 10;
  }
}

// Sparar veckomålet i localStorage så det finns kvar mellan besök.
export function saveWeeklyGoal(goal: number): void {
  localStorage.setItem(WEEKLY_GOAL_KEY, JSON.stringify(goal));
}
