const form = document.getElementById("lost-item-form");
const errorBox = document.getElementById("form-error");
const submitButton = form.querySelector("button[type='submit']");

const showError = (message) => {
  errorBox.textContent = message;
  errorBox.hidden = false;
  errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
};

const hideError = () => {
  errorBox.hidden = true;
  errorBox.textContent = "";
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideError();

  const payload = Object.fromEntries(new FormData(form).entries());

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    const response = await fetch("/api/lost-items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      showError(body?.error || "Something went wrong. Please try again.");
      return;
    }

    window.location.assign("/lost-items?created=1");
  } catch (error) {
    showError(
      "Could not reach the server. Check your connection and try again.",
    );
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit";
  }
});
