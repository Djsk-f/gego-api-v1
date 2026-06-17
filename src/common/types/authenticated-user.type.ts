export type Membership = {
  companyId: string;
  agencyId?: string;
  role: string;
  permissions: string[];
};

export type AuthenticatedUser = {
  id: string;
  email?: string;
  phone?: string;
  type: string;
  memberships: Membership[];
};
