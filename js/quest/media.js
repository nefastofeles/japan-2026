/**
 * Quest media catalog. Missing src is normal: the page still works.
 * Live missions may keep an inline visual; approved script points at ids.
 */

export function mediaById(quest, id) {
  if (!id) return null;
  return (quest?.media || []).find((item) => item.id === id) || null;
}

export function resolveVisual(item, quest) {
  if (item?.visual?.src) return item.visual;
  const id =
    item?.mediaId ||
    (typeof item?.visual === "string" ? item.visual : item?.visual?.id);
  const slot = mediaById(quest, id);
  if (!slot?.src) return null;
  return {
    type: slot.type || "image",
    src: slot.src,
    alt: slot.alt || "",
    credit: slot.credit || "",
  };
}
