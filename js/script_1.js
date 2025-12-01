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
    const inactiveColor = "#BBBCBE";

    lines.forEach((line, i) => {
      line.style.backgroundColor = i < index ? mainColor : inactiveColor;
    });
  };

  async function callFindCarsByDateAPI() {
    try {
      const date = document.getElementById("fromDateInput").value;
      const time = document.getElementById("fromTimeInput").value;

      const fromDate = new Date(`${date}T${time}`);
      const toDate = new Date(fromDate);

      const payload = {
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
      };

      const res = await fetch(
        "https://machshuttle.hayho.org/api/cars/find-by-date",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Client-Timezone-Offset": new Date().getTimezoneOffset() + "",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      console.log("API response:", data);
      renderCars(data.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  }

  function renderCars(list) {
    const container = document.getElementById("carList");
    container.innerHTML = ""; // clear danh sách cũ

    list.forEach((car, index) => {
      container.innerHTML += `
      <label class="car-card-item">
        <input type="radio" name="selectedCar" class="car-checkbox" ${
          index === 0 ? "checked" : ""
        } />

        <img src="${
          car.mainImageUrl || "assests/png/urus_1.png"
        }" class="car-image" />

        <div class="car-info">
          <h3 class="car-name">${car.name}</h3>
          <div class="car-details">
            <span><img src="assests/svg/seat.svg" /> ${car.seats} Seats</span>
            <span><img src="assests/svg/auto.svg" /> Auto</span>
            <span><img src="assests/svg/bag.svg" /> ${car.bags} Bags</span>
          </div>
          <p class="car-desc">Carries up to ${car.seats} passengers.</p>
        </div>

        <div class="car-price">
          <span>$${car.finalPrice}</span>
          <div class="radio"></div>
        </div>
      </label>
    `;
    });
  }

  function validateStep1() {
    const form = document.getElementById("tripForm");
    const requiredFields = [
      "pickupInput",
      "dropoffInput0",
      "fromDateInput",
      "fromTimeInput",
      "airlineInput",
    ];

    let valid = true;

    requiredFields.forEach((id) => {
      const el = document.getElementById(id);
      if (!el || !el.value.trim()) {
        el?.classList.add("is-invalid");
        valid = false;
      } else {
        el.classList.remove("is-invalid");
      }
    });

    form.querySelectorAll('input[type="number"]').forEach((input) => {
      const isBooster = input
        .closest(".col-md-4")
        ?.innerText.includes("Booster");
      if (isBooster) return;

      if (
        !input.value ||
        (input.value < 1 && input.placeholder.toLowerCase().includes("number"))
      ) {
        input.classList.add("is-invalid");
        valid = false;
      } else {
        input.classList.remove("is-invalid");
      }
    });

    if (!valid) alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
    return valid;
  }

  // Next buttons
  document.getElementById("nextBtn").addEventListener("click", async () => {
    // if (!validateStep1()) return;
    await callFindCarsByDateAPI();
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
      <div id="dropoffDropdown${index}" class="autocomplete-dropdown"></div>
    </div>
    <button type="button" class="btn remove-btn">−</button>
  `;

    dropoffList.appendChild(newItem);

    // Gắn autocomplete cho input mới
    const newInput = newItem.querySelector("input.dropoff-input");
    const newDropdown = newItem.querySelector(".autocomplete-dropdown");
    attachAutocomplete(newInput, newDropdown); // ✅ Gắn autocomplete

    // Kích hoạt animation
    requestAnimationFrame(() => {
      newItem.classList.add("show");
      newItem.classList.remove("adding");
    });

    // Xóa stop
    newItem.querySelector(".remove-btn").onclick = () => newItem.remove();

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

  // JS code gọn gàng
  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // Search địa chỉ Mỹ
  async function searchUS(keyword) {
    if (!keyword) return [];
    const res = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: { q: keyword, format: "json", countrycodes: "us", limit: 5 },
      headers: { "User-Agent": "AutoRentalLocationSearch/1.0 (YOUR_EMAIL)" },
    });
    return res.data.map((i) => ({
      address: i.display_name,
      lat: i.lat,
      lng: i.lon,
    }));
  }

  // Gắn autocomplete cho input + dropdown
  function attachAutocomplete(input, dropdown) {
    const handleSearch = debounce(async () => {
      const results = await searchUS(input.value);
      dropdown.innerHTML = results
        .map((r, i) => `<div class="item" data-i="${i}">${r.address}</div>`)
        .join("");

      dropdown.querySelectorAll(".item").forEach((el) => {
        el.onclick = () => {
          const chosen = results[el.dataset.i];
          input.value = chosen.address;
          dropdown.innerHTML = "";
          console.log("Selected:", chosen); // lat/lng
        };
      });
    }, 300);

    input.addEventListener("input", handleSearch);
    input.addEventListener("focus", handleSearch);
  }

  window.onload = () => {
    // Pick up
    attachAutocomplete(
      document.getElementById("pickupInput"),
      document.getElementById("pickupDropdown")
    );

    // Drop off hiện có
    document.querySelectorAll(".dropoff-input").forEach((input, index) => {
      const dropdown = document.getElementById(`dropoffDropdown${index}`);
      attachAutocomplete(input, dropdown);
    });

    // Add Stop
  };
});
