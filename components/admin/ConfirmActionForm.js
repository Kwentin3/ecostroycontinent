"use client";

export function ConfirmActionForm({ action, method = "post", confirmMessage, className, children }) {
  return (
    <form
      action={action}
      method={method}
      className={className}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}
