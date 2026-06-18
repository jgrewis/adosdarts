/* Validation accessible des formulaires côté client.
   NB : pas d'envoi réel — le back serverless + e-mail transactionnel relève
   de la phase de production. On simule la confirmation. */

function setFieldError(field, message) {
  const errorEl = field.querySelector(".field__error");
  field.setAttribute("data-error", String(Boolean(message)));
  const control = field.querySelector("input, select, textarea");
  if (control) control.setAttribute("aria-invalid", String(Boolean(message)));
  if (errorEl) errorEl.textContent = message || "";
}

function validateField(field) {
  const control = field.querySelector("input, select, textarea");
  if (!control) return true;

  if (control.validity.valueMissing) {
    setFieldError(field, "Ce champ est obligatoire.");
    return false;
  }
  if (control.validity.typeMismatch && control.type === "email") {
    setFieldError(field, "Adresse e-mail invalide.");
    return false;
  }
  if (control.validity.patternMismatch) {
    setFieldError(field, control.dataset.errorPattern || "Format invalide.");
    return false;
  }
  setFieldError(field, "");
  return true;
}

export function initForms() {
  const forms = document.querySelectorAll("[data-validate]");

  forms.forEach((form) => {
    // Validation en direct après une première interaction (blur).
    form.querySelectorAll(".field").forEach((field) => {
      const control = field.querySelector("input, select, textarea");
      if (control) control.addEventListener("blur", () => validateField(field));
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = form.querySelector("[data-form-status]");

      const showSuccess = () => {
        if (!status) return;
        status.hidden = false;
        status.className = "form-status form-status--success";
        status.textContent =
          form.dataset.successMessage ||
          "Merci ! Votre message a bien été pris en compte (démonstration).";
        status.setAttribute("role", "status");
        status.scrollIntoView({ behavior: "smooth", block: "center" });
      };

      // Honeypot anti-spam : succès silencieux si le champ piège est rempli.
      const honeypot = form.querySelector("[data-honeypot]");
      if (honeypot && honeypot.value.trim() !== "") {
        showSuccess();
        form.reset();
        return;
      }

      const fields = [...form.querySelectorAll(".field")].filter(
        (f) => !f.closest("[hidden]")
      );

      let firstInvalid = null;
      fields.forEach((field) => {
        if (!validateField(field) && !firstInvalid) firstInvalid = field;
      });

      const requiredChecks = [...form.querySelectorAll('input[type="checkbox"][required]')];
      const checkInvalid = requiredChecks.find((c) => !c.checked);

      if (firstInvalid || checkInvalid) {
        if (status) {
          status.hidden = false;
          status.className = "form-status form-status--error";
          status.textContent =
            "Le formulaire contient des erreurs. Vérifiez les champs signalés.";
        }
        (firstInvalid?.querySelector("input, select, textarea") || checkInvalid)?.focus();
        return;
      }

      showSuccess();
      form.reset();
    });
  });
}
