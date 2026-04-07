export type StaffMemberRatingPublic = {
  id: string;
  staffMemberId: string;
  citizenAccountId: string;
  stars: number;
  detail: string | null;
  /** YYYY-MM */
  monthKey: string;
  createdAt: string;
};

