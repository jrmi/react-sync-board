import React from "react";
import styled from "styled-components";
import { useRecoilValue, useRecoilCallback, useRecoilState } from "recoil";
import debounce from "lodash.debounce";

import {
  SelectedItemsAtom,
  PanZoomRotateAtom,
  BoardStateAtom,
  ItemMapAtom,
  ConfigurationAtom,
  SelectionBoxAtom,
} from "./atoms";

const BoundingBoxZone = styled.div.attrs(({ top, left, height, width }) => ({
  style: {
    transform: `translate(${left}px, ${top}px)`,
    height: `${height}px`,
    width: `${width}px`,
  },
}))`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 210;
  background-color: hsla(0, 40%, 50%, 0%);
  border: 1px dashed hsl(20, 55%, 40%);
  pointer-events: none;
`;

const BoundingBox = () => {
  const selectedItems = useRecoilValue(SelectedItemsAtom);
  const [boundingBoxLast, setBoundingBoxLast] = useRecoilState(
    SelectionBoxAtom
  );
  const panZoomRotate = useRecoilValue(PanZoomRotateAtom);
  const itemMap = useRecoilValue(ItemMapAtom);
  const { uid } = useRecoilValue(ConfigurationAtom);

  // Update selection bounding box
  const updateBox = useRecoilCallback(
    ({ snapshot }) => async () => {
      const currentSelectedItems = await snapshot.getPromise(SelectedItemsAtom);

      if (currentSelectedItems.length === 0) {
        setBoundingBoxLast(null);
        return;
      }

      let boundingBox = null;

      const container = document.getElementById(uid);
      const origin = container.getBoundingClientRect();

      currentSelectedItems.forEach((itemId) => {
        const elem = document.getElementById(itemId);

        if (!elem) return;

        const itemRect = elem.getBoundingClientRect();

        // From origin
        const x = itemRect.left - origin.left;
        const y = itemRect.top - origin.top;
        const x2 = itemRect.right - origin.left;
        const y2 = itemRect.bottom - origin.top;

        if (!boundingBox) {
          boundingBox = { x, y, x2, y2 };
        } else {
          if (x < boundingBox.x) {
            boundingBox.x = x;
          }
          if (y < boundingBox.y) {
            boundingBox.y = y;
          }
          if (x2 > boundingBox.x2) {
            boundingBox.x2 = x2;
          }
          if (y2 > boundingBox.y2) {
            boundingBox.y2 = y2;
          }
        }
      });

      if (!boundingBox) {
        setBoundingBoxLast(null);
        return;
      }

      const newBB = {
        top: boundingBox.y,
        left: boundingBox.x,
        height: boundingBox.y2 - boundingBox.y,
        width: boundingBox.x2 - boundingBox.x,
      };

      setBoundingBoxLast((prevBB) => {
        if (
          !prevBB ||
          prevBB.top !== newBB.top ||
          prevBB.left !== newBB.left ||
          prevBB.width !== newBB.width ||
          prevBB.height !== newBB.height
        ) {
          return newBB;
        }
        return prevBB;
      });
    },
    [setBoundingBoxLast]
  );
  // Debounced version of update box
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateBoxDelay = React.useCallback(
    debounce(() => {
      updateBox();
    }, 300),
    [updateBox]
  );

  React.useEffect(() => {
    // Update selected elements bounding box
    updateBox();
    updateBoxDelay(); // Delay to update after board item animation like tap/untap.
  }, [selectedItems, itemMap, panZoomRotate, updateBox, updateBoxDelay]);

  if (!boundingBoxLast || selectedItems.length < 2) return null;

  return <BoundingBoxZone {...boundingBoxLast} />;
};

const Selection = () => {
  const boardState = useRecoilValue(BoardStateAtom);

  if (boardState.movingItems) {
    return null;
  }

  return <BoundingBox />;
};

export default Selection;
