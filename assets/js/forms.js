/* Validation accessible des formulaires côté client (§13).
   NB : pas d'envoi réel — le back serverless + e-mail transactionnel (§11)
   relève de la phase de production. On simule la confirmation. */

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

/**
 * Gère un parcours mineur : affiche le bloc « responsable légal » quand
 * l'âge déclaré est < 18 et rend ses champs obligatoires.
 */
function wireMinorLogic(form) {
  const ageInput = form.querySelector("[data-age]");
  const parentBlock = form.querySelector("[data-parent-block]");
  if (!ageInput || !parentBlock) return;

  const update = () => {
    const age = Number(ageInput.value);
    const isMinor = Number.isFinite(age) && age > 0 && age < 18;
    parentBlock.hidden = !isMinor;
    parentBlock
      .querySelectorAll("input, select")
      .forEach((el) => (el.required = isMinor));
  };

  ageInput.addEventListener("input", update);
  update();
}

export function initForms() {
  const forms = document.querySelectorAll("[data-validate]");

  forms.forEach((form) => {
    wireMinorLogic(form);

    // Validation en direct après une première interaction (blur).
    form.querySelectorAll(".field").forEach((field) => {
      const control = field.querySelector("input, select, textarea");
      if (control) {
        control.addEventListener("blur", () => validateField(field));
      }
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = form.querySelector("[data-form-status]");

      // Honeypot anti-spam : si le champ piège est rempli, on simule un
      // succès silencieux sans rien « traiter » (on n'aide pas le bot à
      // détecter le filtrage). En production, l'envoi serait simplement ignoré.
      const honeypot = form.querySelector("[data-honeypot]");
      if (honeypot && honeypot.value.trim() !== "") {
        if (status) {
          status.hidden = false;
          status.className = "form-status form-status--success";
          status.textContent =
            form.dataset.successMessage ||
            "Merci ! Ta demande a bien été prise en compte (démonstration).";
          status.setAttribute("role", "status");
        }
        form.reset();
        wireMinorLogic(form);
        return;
      }
      const fields = [...form.querySelectorAll(".field")].filter(
        (f) => !f.closest("[hidden]")
      );

      let firstInvalid = null;
      fields.forEach((field) => {
        if (!validateField(field) && !firstInvalid) firstInvalid = field;
      });

      // Cases à cocher obligatoires (consentement).
      const requiredChecks = [...form.querySelectorAll('input[type="checkbox"][required]')];
      const checkInvalid = requiredChecks.find((c) => !c.checked);

      if (firstInvalid || checkInvalid) {
        if (status) {
          status.hidden = false;
          status.className = "form-status form-status--error";
          status.textContent =
            "Le formulaire contient des erreurs. Vérifie les champs signalés.";
        }
        (firstInvalid?.querySelector("input, select, textarea") || checkInvalid)?.focus();
        return;
      }

      // Succès simulé (aucune donnée transmise dans l'ébauche).
      if (status) {
        status.hidden = false;
        status.className = "form-status form-status--success";
        status.textContent =
          form.dataset.successMessage ||
          "Merci ! Ta demande a bien été prise en compte (démonstration).";
        status.setAttribute("role", "status");
        status.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      form.reset();
      wireMinorLogic(form);
    });
  });
}
