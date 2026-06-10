export interface UserEngagementMonthCount {
  month: number
  count: number
}

export interface UserEngagementData {
  year: number
  months: UserEngagementMonthCount[]
}
