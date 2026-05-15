"use client";

import { useEffect, useState } from "react";

import styles from "./admin-ui.module.css";

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function getInvalidControls(form) {
  if (!form) {
    return [];
  }

  return Array.from(form.elements).filter((element) => (
    element
    && "willValidate" in element
    && element.willValidate
    && element.validity
    && !element.validity.valid
  ));
}

function getFieldLabel(control) {
  const explicitLabel = control.id
    ? control.ownerDocument.querySelector(`label[for="${CSS.escape(control.id)}"]`)
    : null;
  const wrappingLabel = control.closest("label");
  const label = explicitLabel || wrappingLabel;
  const labelTitle = label?.querySelector("span")?.textContent || label?.textContent;

  return normalizeText(
    control.getAttribute("aria-label")
    || labelTitle
    || control.name
    || "поле"
  );
}

function getSectionTitle(control) {
  const details = control.closest("details");
  const sectionTitle = details?.querySelector("summary strong")?.textContent
    || details?.querySelector("summary")?.textContent
    || "";

  return normalizeText(sectionTitle);
}

function revealControl(control, describedById) {
  control.closest("details")?.setAttribute("open", "");
  control.setAttribute("aria-invalid", "true");
  control.setAttribute("aria-describedby", describedById);

  requestAnimationFrame(() => {
    control.scrollIntoView({ block: "center", inline: "nearest" });
    control.focus({ preventScroll: true });
  });
}

export function EntityEditorValidationNotice({ formId }) {
  const [issue, setIssue] = useState(null);
  const noticeId = `${formId}-validation-notice`;

  useEffect(() => {
    const form = document.getElementById(formId);

    if (!form) {
      return undefined;
    }

    function clearControl(control) {
      if (control?.getAttribute("aria-describedby") === noticeId) {
        control.removeAttribute("aria-describedby");
      }

      if (control?.validity?.valid) {
        control.removeAttribute("aria-invalid");
      }
    }

    function showFirstInvalidControl() {
      const [firstInvalid] = getInvalidControls(form);

      if (!firstInvalid) {
        setIssue(null);
        return;
      }

      const fieldLabel = getFieldLabel(firstInvalid);
      const sectionTitle = getSectionTitle(firstInvalid);
      const message = firstInvalid.validationMessage || "Заполните обязательное поле.";

      setIssue({
        fieldLabel,
        sectionTitle,
        message,
        fieldName: firstInvalid.name || ""
      });
      revealControl(firstInvalid, noticeId);
    }

    function handleInvalid(event) {
      event.preventDefault();
      showFirstInvalidControl();
    }

    function handleInput(event) {
      clearControl(event.target);

      if (getInvalidControls(form).length === 0) {
        setIssue(null);
      }
    }

    function handleSubmit() {
      setIssue(null);
    }

    form.addEventListener("invalid", handleInvalid, true);
    form.addEventListener("input", handleInput, true);
    form.addEventListener("change", handleInput, true);
    form.addEventListener("submit", handleSubmit);

    return () => {
      form.removeEventListener("invalid", handleInvalid, true);
      form.removeEventListener("input", handleInput, true);
      form.removeEventListener("change", handleInput, true);
      form.removeEventListener("submit", handleSubmit);
    };
  }, [formId, noticeId]);

  function focusField() {
    const form = document.getElementById(formId);
    const control = issue?.fieldName
      ? form?.elements.namedItem(issue.fieldName)
      : getInvalidControls(form)[0];
    const target = control && "length" in control && !("focus" in control)
      ? control[0]
      : control;

    if (target) {
      revealControl(target, noticeId);
    }
  }

  if (!issue) {
    return null;
  }

  return (
    <div id={noticeId} className={styles.editorValidationNotice} role="alert" aria-live="assertive">
      <strong>Не удалось сохранить: заполните обязательное поле.</strong>
      <span>
        {issue.sectionTitle ? `${issue.sectionTitle}: ` : null}
        {issue.fieldLabel}
        {issue.message ? ` — ${issue.message}` : null}
      </span>
      <button type="button" className={styles.inlineTextButton} onClick={focusField}>
        Перейти к полю
      </button>
    </div>
  );
}
