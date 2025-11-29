export type CustomerApiResponse = {
  id: number;
  name: string;
  start_datetime: string | null;
  end_datetime: string | null;
  total_amount: string;
  paid: boolean;
  membership: number | null;
  is_breaking: boolean;
};

export type CustomerBreak = {
  id: number;
  start_datetime: string | null;
  end_datetime: string | null;
};

export type MembershipSearchResult = {
  id: number;
  first_name: string;
  last_name: string;
  phone_number?: string;
  register_date?: string;
  is_expired?: boolean;
};

// 表示用の顧客データ
export type Customer = {
  id: string;
  name: string;
  startTime: string;
  isBreaking: boolean;
  startDatetime: string | null;
  endDatetime: string | null;
  isMember: boolean;
};


