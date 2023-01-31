import { create } from "zustand";
import { shallow } from "zustand/shallow";

const useSelectionBare = create((set, get) => ({
  selection: [],
  setSelection: (idsToSelect) =>
    set((state) => {
      if (JSON.stringify(state.selection) !== JSON.stringify(idsToSelect)) {
        return { selection: idsToSelect };
      }
      return {};
    }),
  getSelection: () => get().selection,
  select: (idsToAdd) =>
    set((state) => ({
      selection: [...state.selection, ...idsToAdd],
    })),
  unselect: (itemsIdToRemove) =>
    set((state) => ({
      selection: state.selection.filter((id) => !itemsIdToRemove.includes(id)),
    })),
  clear: () =>
    set((state) => {
      if (state.selection.length > 0) {
        return { selection: [] };
      } else {
        return {};
      }
    }),
  reverse: () =>
    set((state) => {
      const reversed = [...state.selection];
      reversed.reverse();
      return { selection: reversed };
    }),
  selectionBox: null,
  setSelectionBox: (newSelectionBox) =>
    set((state) => {
      const prevBB = state.selectionBox;
      if (
        !prevBB ||
        !newSelectionBox ||
        prevBB.top !== newSelectionBox.top ||
        prevBB.left !== newSelectionBox.left ||
        prevBB.width !== newSelectionBox.width ||
        prevBB.height !== newSelectionBox.height
      ) {
        return { selectionBox: newSelectionBox };
      }
      return {};
    }),
}));

const useSelection = (selector, equalityFn)=>{
  return useSelectionBare(selector, equalityFn? equalityFn: shallow)
}


export default useSelection;
