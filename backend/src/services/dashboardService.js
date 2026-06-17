import { logRepo } from "../repositories/logRepo.js";
import { userRepo } from "../repositories/userRepo.js";
import { clampInt } from "../utils/validate.js";

export const dashboardService = {
  async summary() {
    const [s, activeUsers] = await Promise.all([logRepo.summary(), userRepo.countActive()]);
    const attempts = s.total_enroll_attempts ?? 0;
    const successRate = attempts > 0 ? Math.round((s.total_enrollments / attempts) * 100) : 0;
    return {
      totalEnrollments: s.total_enrollments,
      todayEnrollments: s.today_enrollments,
      failedEnrollments: s.failed_enrollments,
      totalLookups: s.total_lookups,
      enrollmentAttempts: attempts,
      successRate,
      activeUsers,
    };
  },

  async timeseries(range) {
    const days = range === "30d" ? 30 : range === "14d" ? 14 : 7;
    return logRepo.timeseries(days);
  },

  async breakdown(limitRaw) {
    const limit = clampInt(limitRaw, { min: 1, max: 50, fallback: 10 });
    const [byAction, byUser, recent] = await Promise.all([
      logRepo.byAction(),
      logRepo.byUser(8),
      logRepo.recent(limit),
    ]);
    return { byAction, byUser, recent };
  },
};
