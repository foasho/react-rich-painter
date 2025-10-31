import { create } from 'zustand';
import { InputType } from './ui';

type UtilsState = {
  userSelectInput: InputType;
  setUserSelectInput: (userSelectInput: InputType) => void;
}

const useUtilsStore = create<UtilsState>((set) => ({
  userSelectInput: "mouse",
  setUserSelectInput: (userSelectInput) => set({ userSelectInput }),
}));

export { useUtilsStore };
