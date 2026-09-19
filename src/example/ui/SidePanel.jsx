import React from "react";
import styled from "@emotion/styled";
import { createPortal } from "react-dom";

import useTranslation from "../useTranslation";

const StyledSidePanel = styled.div`
  position: absolute;
  ${({ position }) => (position === "right" ? "right: 0;" : "left: 0;")}
  top: 12px;
  bottom: 12px;
  z-index: ${({ modal }) => (modal ? 290 : 280)};
  display: flex;
  flex-direction: column;
  height: auto;
  max-height: 100%;
  overflow: hidden;

  color: #172033;
  background: ${({ modal }) =>
    modal ? "var(--color-darkGrey)" : "rgb(255 255 255 / 96%)"};
  border: 1px solid rgb(255 255 255 / 80%);
  border-radius: 14px;
  box-shadow: 0 15px 40px rgb(15 23 42 / 22%);
  backdrop-filter: blur(14px);

  min-width: 280px;
  max-width: min(500px, calc(100% - 24px));
  width: ${({ width }) => (width ? `${width}` : "25%")};

  overflow-y: auto;

  transform: translateX(100%);
  transition: transform 260ms cubic-bezier(0.4, 0, 0.2, 1), opacity 180ms;

  ${({ open, position }) => {
    let start = -100;
    const end = 0;
    if (position === "right") {
      start = 100;
    }
    return open
      ? `transform: translateX(${end}%);`
      : `transform: translateX(${start}%);`;
  }}

  ${({ open }) => (open ? "opacity: 1;" : "opacity: 0.2;")}

  & > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 57px;
    padding: 0 10px 0 17px;
    border-bottom: 1px solid #dce3ed;
  }

  & .title {
    color: #34415a;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .09em;
    text-transform: uppercase;
    margin: 0;
  }

  & .close {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    min-height: 32px;
    padding: 0;
    color: #64748b;
    font-size: 23px;
    font-weight: 400;
    line-height: 1;
    background: #f2f5f9;
    border: 1px solid #dce4ee;
    border-radius: 8px;
  }

  & .close:hover { color: #172033; background: #e8edf5; }

  & > .content {
    flex: 1;
    overflow: auto;
    ${({ noMargin }) => (noMargin ? "" : "padding: 16px")};
    color: #4c5a70;
    font-size: 13px;

    & label {
      display: grid;
      gap: 6px;
      padding-bottom: 18px;
      font-weight: 600;
    }

    & label:has(input[type="checkbox"]) {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    & input, & select {
      min-height: 34px;
      color: #172033;
      background: #f8fafc;
      border: 1px solid #d8e0eb;
      border-radius: 6px;
    }

    & input[type="checkbox"] {
      width: 15px;
      min-height: 15px;
      accent-color: var(--color-primary);
    }

    & .rc-slider { margin: 7px 5px 13px; }
    & .rc-slider-rail { background-color: #dce3ed; }
    & .rc-slider-track { background-color: var(--color-primary); }
    & .rc-slider-handle { border-color: var(--color-primary); }

    & header {
      padding: 10px 12px;
      margin-top: 18px;
      color: #34415a;
      background-color: #f2f5f9;
      border-radius: 8px 8px 0 0;
      & h3 {
        margin: 0;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
    }

    & header:first-of-type {
      margin-top: 0;
    }

    & section {
      border: 1px solid #e1e7ef;
      border-top: 0;
      border-radius: 0 0 8px 8px;
      padding: 16px;
      background-color: #fff;
    }
  }

  & footer {
    margin-top: 1em;
  }

  @media (max-width: 720px) {
    top: 8px;
    right: 8px;
    bottom: 8px;
    left: 8px;
    width: auto;
    max-width: none;
    min-width: 0;
  }
`;

const SidePanel = ({
  children,
  position,
  noMargin,
  onClose = () => {},
  title,
  footer,
  show,
  open = show,
  modal = false,
  width,
}) => {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = React.useState(false);

  const onAnimationEnd = React.useCallback(() => {
    if (!isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (open) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [open]);

  return (
    <div>
      {createPortal(
        <StyledSidePanel
          position={position}
          open={isOpen}
          onTransitionEnd={onAnimationEnd}
          noMargin={noMargin}
          width={width}
          modal={modal}
          className={isOpen ? "side-panel open" : "side-panel"}
        >
          <header>
            {title && <h2 className="title">{title}</h2>}
            <button
              className="button clear icon-only close"
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={t("Close")}
            >
              ×
            </button>
          </header>
          <div className="content">{open && children}</div>
          {footer && <footer>{footer}</footer>}
        </StyledSidePanel>,
        document.getElementById(`portal-container-uid`)
      )}
    </div>
  );
};

export default SidePanel;
