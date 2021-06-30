import React from "react";
import { useTranslation } from "react-i18next";
import ItemLibrary from "./ItemLibrary";

import Touch from "./ui/Touch";
import SidePanel from "./ui/SidePanel";

const AddItemButton = ({ itemLibraries }) => {
  const { t } = useTranslation();

  const [showAddPanel, setShowAddPanel] = React.useState(false);
  const [tab, setTab] = React.useState(itemLibraries[0]?.key || "standard");

  React.useEffect(() => {
    setTab(itemLibraries[0]?.key || "standard");
  }, [itemLibraries]);
  console.log(tab);

  return (
    <>
      <Touch
        onClick={() => setShowAddPanel((prev) => !prev)}
        alt={t("Add item")}
        title={t("Add item")}
        label={t("Add")}
        icon={showAddPanel ? "cross" : "plus"}
      />
      <SidePanel
        open={showAddPanel}
        onClose={() => {
          setShowAddPanel(false);
        }}
        position="right"
        width="33%"
      >
        <nav className="tabs">
          {itemLibraries.map(({ name, key }) => (
            <a
              onClick={() => setTab(key)}
              className={tab === key ? "active" : ""}
              style={{ cursor: "pointer" }}
              key={key}
            >
              {name}
            </a>
          ))}
        </nav>
        <section className="content">
          {itemLibraries.map(({ key, items }) =>
            tab === key ? <ItemLibrary items={items} key={key} /> : null
          )}
        </section>
      </SidePanel>
    </>
  );
};

export default AddItemButton;
