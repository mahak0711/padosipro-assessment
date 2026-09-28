export type AuthStackParamList = {
  Register: undefined;
  VerifyOtp: { email: string };
  Login: { verifiedEmail?: string } | undefined;
  ServerSettings: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  TaskSelection: undefined;
};
