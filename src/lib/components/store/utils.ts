import { create } from 'zustand';
import { UserSelectInputType } from '../../utils/canvas/userUtilities';

type UtilsState = {
  userSelectInput: UserSelectInputType;
  setUserSelectInput: (userSelectInput: UserSelectInputType) => void;
}

const useUtilsStore = create<UtilsState>((set) => ({
  userSelectInput: "mouse",
  setUserSelectInput: (userSelectInput) => set({ userSelectInput }),
}));

export { useUtilsStore };
