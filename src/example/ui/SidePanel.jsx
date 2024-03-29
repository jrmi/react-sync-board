import React from "react";
import styled from "@emotion/styled";
import { createPortal } from "react-dom";

import useTranslation from "../useTranslation";

const StyledSidePanel = styled.div`
  position: absolute;
  ${({ position }) => (position === "right" ? "right: 0;" : "left: 0;")}
  top: 0;
  bottom: 0;
  z-index: ${({ modal }) => (modal ? 290 : 280)};
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  overflow: hidden;

  background-color: ${({ modal }) =>
    modal ? "var(--color-darkGrey)" : "var(--color-blueGrey)"};

  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;

  min-width: 280px;
  max-width: 500px;
  width: ${({ width }) => (width ? `${width}` : "25%")};

  overflow-y: auto;

  transform: translateX(100%);
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);

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

  & .close {
    position: fixed;
    top: 5px;
    right: 10px;
  }

  & .title {
    font-weight: 700;
    padding: 0.5em;
    margin: 0;
  }

  & > .content {
    flex: 1;
    overflow: auto;
    ${({ noMargin }) => (noMargin ? "" : "padding: 1em")};
    & header {
      padding: 0.5em;
      margin-top: 2em;
      background-color: var(--color-blueGrey);
      border-radius: 0.5em 0.5em 0em 0em;
      & h3 {
        margin: 0.2em 0.2em 0.2em;
        font-weight: 300;
      }
    }

    & header:first-of-type {
      margin-top: 0;
    }

    & section {
      border-radius: 0em 0em 0.5em 0.5em;
      padding: 2em;
      background-color: var(--color-darkBlueGrey);
    }
  }

  & footer {
    margin-top: 1em;
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
              onClick={() => setIsOpen(false)}
            >
              <img
                src="https://icongr.am/feather/x.svg?size=42&color=ffffff"
                alt={t("Close")}
              />
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
