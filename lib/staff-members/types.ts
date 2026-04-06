export type StaffMemberPublic = {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  jobTitle: string;
  avatarRelativePath: string | null;
  contactEmail: string | null;
  sortOrder: number;
  isActive: boolean;
};
