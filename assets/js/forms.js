/* Validation accessible des formulaires côté client, puis envoi réel au
   script PHP (assets/php/envoi-contact.php) via fetch(). Sans JavaScript,
   le <form action method> natif prend le relais et le script répond en HTML. */

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

function showStatus(status, kind, message) {
  if (!status) return;
  status.hidden = false;
  status.className = `form-status form-status--${kind}`;
  status.textContent = message;
  status.setAttribute("role", "status");
  status.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function envoyerFormulaire(form, status, submitButton) {
  try {
    const reponse = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { "X-Requested-With": "fetch" },
    });
    const donnees = await reponse.json();

    if (donnees.ok) {
      showStatus(
        status,
        "success",
        form.dataset.successMessage || donnees.message
      );
      form.reset();
    } else {
      showStatus(
        status,
        "error",
        donnees.message || "Le formulaire contient des erreurs. Vérifiez les champs signalés."
      );
    }
  } catch (erreur) {
    showStatus(
      status,
      "error",
      "L'envoi a échoué. Vérifiez votre connexion et réessayez, ou écrivez-nous directement à contact@adosdarts.fr."
    );
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
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
      const submitButton = form.querySelector('button[type="submit"]');

      // Honeypot anti-spam : succès silencieux si le champ piège est rempli, pas d'envoi.
      const honeypot = form.querySelector("[data-honeypot]");
      if (honeypot && honeypot.value.trim() !== "") {
        showStatus(status, "success", form.dataset.successMessage || "Merci !");
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
        showStatus(status, "error", "Le formulaire contient des erreurs. Vérifiez les champs signalés.");
        (firstInvalid?.querySelector("input, select, textarea") || checkInvalid)?.focus();
        return;
      }

      if (submitButton) submitButton.disabled = true;
      envoyerFormulaire(form, status, submitButton);
    });
  });
}
