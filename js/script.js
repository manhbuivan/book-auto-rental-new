document.addEventListener("DOMContentLoaded", () => {
  const steps = document.querySelectorAll(".step");
  const contents = document.querySelectorAll(".step-content");
  let currentStep = 0;

  const showStep = (index) => {
    contents.forEach((c, i) => c.classList.toggle("active", i === index));
    steps.forEach((s, i) => s.classList.toggle("active", i <= index));
  };

  // Next buttons
  document.getElementById("nextBtn").addEventListener("click", () => {
    if (currentStep < contents.length - 1) {
      currentStep++;
      showStep(currentStep);
    }
  });

  document.getElementById("nextToPayment").addEventListener("click", () => {
    if (currentStep < contents.length - 1) {
      currentStep++;
      showStep(currentStep);
    }
  });

  // Back buttons
  document.getElementById("backBtn1").addEventListener("click", () => {
    currentStep = Math.max(0, currentStep - 1);
    showStep(currentStep);
  });

  document.getElementById("backBtn2").addEventListener("click", () => {
    currentStep = Math.max(0, currentStep - 1);
    showStep(currentStep);
  });

  // Add stop logic
  const addStopBtn = document.getElementById("addStop");
  const dropOffList = document.getElementById("dropOffList");

  addStopBtn.addEventListener("click", () => {
    const count = dropOffList.querySelectorAll(".input-group").length + 1;
    const group = document.createElement("div");
    group.classList.add("input-group", "mb-2");
    group.innerHTML = `
      <span class="input-group-text bg-warning text-dark border-0">${count}</span>
      <input type="text" class="form-control bg-dark text-light" placeholder="Enter Address, Point of Interest or Airpod Code">
      <button class="btn btn-outline-danger remove-stop" type="button">−</button>
    `;
    dropOffList.appendChild(group);
  });

  dropOffList.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-stop")) {
      e.target.closest(".input-group").remove();
      dropOffList.querySelectorAll(".input-group-text").forEach((el, idx) => {
        el.textContent = idx + 1;
      });
    }
  });

  showStep(currentStep);
});
