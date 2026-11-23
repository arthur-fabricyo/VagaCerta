export type HourlyMovement = {
  hour: number;
  entries: number;
  exits: number;
};

export type DashboardSummary = {
  unitId: string;
  localDate: string;
  timeZone: string;
  vehiclesOnSite: number;
  entriesToday: number;
  exitsToday: number;
  hourly: HourlyMovement[];
};
