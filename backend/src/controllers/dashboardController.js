import { dashboardService } from "../services/dashboardService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const dashboardController = {
  summary: asyncHandler(async (_req, res) => {
    res.json({ data: await dashboardService.summary() });
  }),
  timeseries: asyncHandler(async (req, res) => {
    res.json({ data: await dashboardService.timeseries(req.query.range) });
  }),
  breakdown: asyncHandler(async (req, res) => {
    res.json({ data: await dashboardService.breakdown(req.query.limit) });
  }),
};
