import deleteIcon from "../images/delete.svg";
import lockIcon from "../images/lock.svg";

const t = (s) => s;

const toggleLock = async (itemIds, _, { batchUpdateItems }) => {
  batchUpdateItems(itemIds, (item) => ({
    ...item,
    locked: !item.locked,
  }));
};

const remove = async (itemIds, _, { removeItems }) => {
  removeItems(itemIds);
};

const actionMap = {
  lock: {
    action: toggleLock,
    label: `${t("Unlock")}/${t("Lock")}`,
    disableDblclick: true,
    icon: lockIcon,
  },
  remove: {
    action: remove,
    label: t("Remove all"),
    shortcut: "Delete",
    edit: true,
    disableDblclick: true,
    icon: deleteIcon,
  },
};

export default actionMap;
