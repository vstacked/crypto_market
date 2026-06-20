import { useAppSelector } from "@/store";

export const useIsLoggedIn = () => {
  const user = useAppSelector((state) => state.auth);
  return !!user.token && !user.otp && !user.isRestoringToken;
};

export const useIsGuest = () => {
  const user = useAppSelector((state) => state.auth);
  return (!user.token || !!user.otp) && !user.isRestoringToken;
};

export const useIsRestoringToken = () => {
  const user = useAppSelector((state) => state.auth);
  return user.isRestoringToken;
};
