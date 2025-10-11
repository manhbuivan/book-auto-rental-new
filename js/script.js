document.addEventListener("DOMContentLoaded", () => {
  const steps = document.querySelectorAll(".step");
  const contents = document.querySelectorAll(".step-content");
  let currentStep = 0;

  const showStep = (index) => {
    contents.forEach((c, i) => c.classList.toggle("active", i === index));
    steps.forEach((s, i) => {
      s.classList.toggle("active", i === index);

      const img = s.querySelector(".step-icon");
      if (i < index) {
        img.src = "assests/svg/checked.svg";
      } else if (i === index) {
        img.src = "assests/svg/checking.svg";
      } else {
        img.src = "assests/svg/un-check.svg";
      }
    });

    const lines = document.querySelectorAll(".line");
    const rootStyles = getComputedStyle(document.documentElement);
    const mainColor = rootStyles.getPropertyValue("--main-color").trim();

    lines.forEach((line, i) => {
      if (index === 0) {
        line.style.backgroundColor = "#BBBCBE";
      } else {
        line.style.backgroundColor = i < index ? mainColor : inactiveColor;
      }
    });
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

  // ============== Add stop logic ================

  const dropoffList = document.getElementById("dropoffList");
  const addStopBtn = document.getElementById("addStop");

  function updateNumbers() {
    const items = dropoffList.querySelectorAll(".dropoff-item");
    items.forEach((item, index) => {
      const circle = item.querySelector(".circle-number");
      if (circle) circle.textContent = index + 1;
    });
  }

  addStopBtn.addEventListener("click", () => {
    const items = dropoffList.querySelectorAll(".dropoff-item");

    // Nếu là lần add đầu tiên → thêm số cho dòng đầu tiên (nhưng KHÔNG thêm nút trừ)
    if (items.length === 1 && !items[0].querySelector(".circle-number")) {
      const first = items[0];
      const wrapper = first.querySelector(".input-wrapper");
      wrapper.classList.add("has-number");
      wrapper.insertAdjacentHTML(
        "afterbegin",
        `<span class="circle-number">1</span>`
      );
    }

    // Tạo ô mới
    const index = items.length + 1;
    const newItem = document.createElement("div");
    newItem.className = "dropoff-item d-flex align-items-center adding";
    newItem.innerHTML = `
    <div class="input-wrapper position-relative flex-grow-1 has-number">
      <span class="circle-number">${index}</span>
      <input
        type="text"
        class="form-control dropoff-input"
        placeholder="Enter Address, Point of Interest or Airpod Code"
      />
    </div>
    <button type="button" class="btn remove-btn">−</button>
  `;

    dropoffList.appendChild(newItem);

    // Kích hoạt animation
    requestAnimationFrame(() => {
      newItem.classList.add("show");
      newItem.classList.remove("adding");
    });

    updateNumbers();
  });

  // Xóa dòng
  dropoffList.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-btn")) {
      const item = e.target.closest(".dropoff-item");
      const items = Array.from(dropoffList.querySelectorAll(".dropoff-item"));
      const index = items.indexOf(item);

      if (index === 0) return;

      item.classList.add("removing");
      item.addEventListener(
        "transitionend",
        () => {
          item.remove();

          const remaining = dropoffList.querySelectorAll(".dropoff-item");
          if (remaining.length === 1) {
            const first = remaining[0];
            first.querySelector(".circle-number")?.remove();
            first.querySelector(".remove-btn")?.remove();
            first
              .querySelector(".input-wrapper")
              .classList.remove("has-number");
          }

          updateNumbers();
        },
        { once: true }
      );
    }
  });

  showStep(currentStep);
});
