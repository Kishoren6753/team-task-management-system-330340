// PUBLIC_INTERFACE
export function statusPillClass(status) {
  /** Map task status to pill style class. */
  if (status === "Done") return "pill pillAccent";
  if (status === "In Progress") return "pill pillPrimary";
  if (status === "Blocked") return "pill pillDanger";
  return "pill";
}

// PUBLIC_INTERFACE
export function priorityPillClass(priority) {
  /** Map priority to pill style class. */
  if (priority === "High") return "pill pillDanger";
  if (priority === "Medium") return "pill pillPrimary";
  if (priority === "Low") return "pill pillAccent";
  return "pill";
}
