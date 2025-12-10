document.addEventListener("DOMContentLoaded", () => {
  const steps = document.querySelectorAll(".step");
  const contents = document.querySelectorAll(".step-content");
  const coupons = {
    "KMBK13": 50,
    "WELCOME10": 10,
    "VIP100": 100,
    "NEWYEAR": 75,
    "FLASH20": 20
  };
  let currentStep = 0;
  let rentsData = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    carId: null,
    fromDate: "",
    toDate: "",
    promotionCode: "",
    pickupLocation: "",
    pickupEvent: "",
    selfDriveInsurance: false,
    totalPrice: 0,
  };

  function formattedPrice(price) {
    return price.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  document.querySelector("#applyCouponBtn").addEventListener("click", function() {
    const couponInput = document.querySelector("#couponInput");
    const couponCode = couponInput.value.trim().toUpperCase();
    const discountElem = document.querySelector("#price-discount");
    const totalElem = document.querySelector("#price-total");
    if (coupons[couponCode]) {
      rentsData.promotionCode = couponCode;
      if (discountElem) discountElem.textContent = `-${formattedPrice(coupons[couponCode])}`;
      if (totalElem && (rentsData.totalPrice >= coupons[couponCode])) totalElem.textContent = `${formattedPrice(rentsData.totalPrice - coupons[couponCode])}`;
    } else {
      alert("Invalid coupon code!");
      if (discountElem) discountElem.textContent = "-$0";
      if (totalElem) totalElem.textContent = `${formattedPrice(rentsData.totalPrice)}`;
      couponInput.focus();
    }
  });

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

  // ============== Render ================
  function renderCars(list) {
    const container = document.getElementById("carList");
    container.innerHTML = ""; // clear danh sách cũ

    list.forEach((car, index) => {
      container.innerHTML += `
      <label class="car-card-item" data-car-id="${car.id}">
        <input type="radio" name="selectedCar" class="car-checkbox" ${
          index === 0 ? "checked" : ""
        } />

        <img src="${
          car.mainImageUrl || "assests/png/urus_1.png"
        }" class="car-image" />

        <div class="car-info">
          <h3 class="car-name">${car.name}</h3>
          <div class="car-details">
            <span id="seats"><img src="assests/svg/seat.svg" /> ${
              car.seats || 0
            } Seats</span>
            <span><img src="assests/svg/auto.svg" /> Auto</span>
            <span id="bags"><img src="assests/svg/bag.svg" /> ${
              car.bags || 0
            } Bags</span>
          </div>
          <p class="car-desc">Carries up to ${car.seats || 0} passengers.</p>
        </div>

        <div class="car-price">
          <span>${formattedPrice(car.finalPrice || 0)}</span>
          <div class="radio"></div>
        </div>
      </label>
    `;
    });
  }

  function renderInfo() {
    const step3Content = contents[2];

    // Fill user info
    const userName = step3Content.querySelector("#fullName strong");
    if (userName)
      userName.textContent = `${rentsData.firstName} ${rentsData.lastName}`;

    const phoneElem = step3Content.querySelector("#phone");
    if (phoneElem)
      phoneElem.innerHTML = `<img src="assests/svg/phone.svg" /> ${
        rentsData.phone || "N/A"
      }`;

    const emailElem = step3Content.querySelector("#email");
    if (emailElem)
      emailElem.innerHTML = `<img src="assests/svg/mail.svg" /> ${rentsData.email}`;

    //Fill pickup location
    const addressElem = step3Content.querySelector("#address");
    if (addressElem) {
      addressElem.innerHTML = `<img src="assests/svg/address.svg" /> ${rentsData.address}`;
    }

    //Fill dates
    const pickupDateElem = step3Content.querySelector("#pickupDate");
    if (pickupDateElem && rentsData.fromDate && rentsData.fromTime) {
      const formattedDate = new Date(`${rentsData.fromDate}T${rentsData.fromTime}`).toLocaleString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
      pickupDateElem.innerHTML = `<strong class="text-pickup">Pick Up Date:</strong> ${formattedDate}`;
    }

    const dropupDateElem = step3Content.querySelector("#dropupDate");
    if (dropupDateElem && rentsData.toDate && rentsData.toTime) {
      const formattedDate = new Date(`${rentsData.toDate}T${rentsData.toTime}`).toLocaleString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
      dropupDateElem.innerHTML = `<strong class="text-pickup">Drop Up Date:</strong> ${formattedDate}`;
    }

    const pickupLocationElem = step3Content.querySelector("#pickupLocation");
    if (pickupLocationElem && rentsData.pickupLocation) {
      const locationMap = {
        'airport': 'Airport',
        'hotel': 'Hotel',
        'city_center': 'City Center'
      };
  
      const textPickupLocation = locationMap[rentsData.pickupLocation] || 'City Center';
      pickupLocationElem.innerHTML = `<strong class="text-pickup">Drop Up Date:</strong> ${textPickupLocation}`;
    }

    const pickupEventElem = step3Content.querySelector("#pickupEvent");
    if (pickupEventElem && rentsData.pickupEvent) {
      const eventMap = {
        'conference': 'Conference',
        'wedding': 'Wedding',
        'vacation': 'Vacation',
      }
      const textPickupEvent = eventMap[rentsData.pickupEvent] || 'Vacation';
      pickupEventElem.innerHTML = `<strong class="text-pickup">Pick Up Event:</strong> ${textPickupEvent}`;
    }

    const selectedCarRadio = document.querySelector(
      'input[name="selectedCar"]:checked'
    );
    if (selectedCarRadio) {
      const carCard = selectedCarRadio.closest(".car-card-item");
      rentsData.carId = parseInt(carCard.dataset.carId);
      const carName = carCard.querySelector(".car-name").textContent;
      const carSeats = carCard.querySelector(".car-details #seats").textContent;
      const carBags = carCard.querySelector(".car-details #bags").textContent;
      const carImage = carCard.querySelector(".car-image").src;
      const carPrice = carCard.querySelector(".car-price span").textContent;

      // Update car card in step 3
      const step3CarName = step3Content.querySelector(".car-card .car-name");
      if (step3CarName) step3CarName.textContent = carName;

      const step3CarImage = step3Content.querySelector(
        ".car-card .img-car img"
      );
      if (step3CarImage) step3CarImage.src = carImage;

      const step3CarSeats = step3Content.querySelector("#seats-info");
      if (step3CarSeats)
        step3CarSeats.innerHTML = `<img src="assests/svg/seat.svg" />${carSeats}`;

      const step3CarBags = step3Content.querySelector("#bags-info");
      if (step3CarBags)
        step3CarBags.innerHTML = `<img src="assests/svg/bag.svg" />${carBags}`;

      // Update subtotal
      const subtotalElem = step3Content.querySelector("#price-subtotal");
      if (subtotalElem) subtotalElem.textContent = carPrice;

      if (rentsData.selfDriveInsurance) {
        const insuranceElem = step3Content.querySelector("#price-insurance");
        if (insuranceElem) insuranceElem.textContent = "$20";
      } else {
        const insuranceElem = step3Content.querySelector("#price-insurance");
        if (insuranceElem) insuranceElem.textContent = "$0";
      }

      const subtotal = parseFloat(carPrice.replace(/[$,]/g, ""));
      const boosterSeat = 15;
      const insurance = rentsData.selfDriveInsurance ? 20 : 0;
      const total = subtotal + boosterSeat + insurance;
      rentsData.totalPrice = total;

      const totalElem = step3Content.querySelector("#price-total");
      if (totalElem) totalElem.textContent = `${formattedPrice(total)}`;
    }
  }

  // ============== VALIDATION ================
  function validateStep1() {
    const email = document.getElementById("emailInput");
    const phone = document.getElementById("phoneInput");
    const requiredFields = [
      "firstNameInput",
      "lastNameInput",
      "addressInput",
      "fromDateInput",
      "fromTimeInput",
      "toDateInput",
      "toTimeInput",
      "pickupLocationInput",
      "pickupEventInput",
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim() || !emailRegex.test(email.value.trim())) {
      email.classList.add("is-invalid");
      valid = false;
    } else {
      email.classList.remove("is-invalid");
    }

    const phoneRegex = /^[\+]?1?[-.\s]?(\([0-9]{3}\)|[0-9]{3})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;
    if (!phone.value.trim() || !phoneRegex.test(phone.value.trim())) {
      phone.classList.add("is-invalid");
      valid = false;
    } else {
      phone.classList.remove("is-invalid");
    }
    
    if (valid) {
      rentsData.firstName = document
        .getElementById("firstNameInput")
        .value.trim();
      rentsData.lastName = document
        .getElementById("lastNameInput")
        .value.trim();
      rentsData.email = document.getElementById("emailInput").value.trim();
      rentsData.phone = document.getElementById("phoneInput").value.trim();
      rentsData.address = document.getElementById("addressInput").value.trim();
      rentsData.fromDate = document
        .getElementById("fromDateInput")
        .value.trim();
      rentsData.fromTime = document
        .getElementById("fromTimeInput")
        .value.trim();
      rentsData.toDate = document.getElementById("toDateInput").value.trim();
      rentsData.toTime = document.getElementById("toTimeInput").value.trim();
      rentsData.pickupLocation = document
        .getElementById("pickupLocationInput")
        .value.trim();
      rentsData.pickupEvent = document
        .getElementById("pickupEventInput")
        .value.trim();
    }

    return valid;
  }

  // ============== API Calls ================
  async function callFindCarsByDateAPI() {
    try {
      const fromDateInput = document.getElementById("fromDateInput").value;
      const fromTimeInput = document.getElementById("fromTimeInput").value;

      const toDateInput = document.getElementById("toDateInput").value;
      const toTimeInput = document.getElementById("toTimeInput").value;

      const fromDate = new Date(`${fromDateInput}T${fromTimeInput}`);
      const toDate = new Date(`${toDateInput}T${toTimeInput}`);

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
      if (data.success && data.data) {
        renderCars(data.data);
        return data.data;
      } else {
        alert(data.message);
        return null;
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  }

  async function createRents() {
    try {
      const payload = {
        firstName: rentsData.firstName,
        lastName: rentsData.lastName,
        email: rentsData.email,
        phone: rentsData.phone,
        carId: rentsData.carId,
        fromDate: new Date(
          `${rentsData.fromDate}T${rentsData.fromTime}`
        ).toISOString(),
        toDate: new Date(
          `${rentsData.toDate}T${rentsData.toTime}`
        ).toISOString(),
        promotionCode: rentsData.promotionCode,
      };

      const res = await fetch(
        "https://machshuttle.hayho.org/api/rents/create",
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

      if (data.success) {
        alert("Rent created successfully!");
      } else {
        alert(data.message || "Rent failed!");
      }
    } catch (err) {
      console.error("Rent Error:", err);
    }
  }

  // ============== Next/Back Buttons ================
  document.getElementById("nextBtn").addEventListener("click", async () => {
    if (!validateStep1()) return;

    // Show loading
    const btn = document.getElementById("nextBtn");
    const originalText = btn.textContent;
    btn.textContent = "Loading...";
    btn.disabled = true;

    const dateCars = await callFindCarsByDateAPI();

    btn.textContent = originalText;
    btn.disabled = false;

    if (!dateCars) return;

    if (currentStep < contents.length - 1) {
      currentStep++;
      showStep(currentStep);
    }
  });

  document.getElementById("nextToPayment").addEventListener("click", () => {
    const selfDriveInsurance =
      document.getElementById("selfDriveInsurance").checked;
    if (selfDriveInsurance) {
      rentsData.selfDriveInsurance = true;
    }

    renderInfo();

    if (currentStep < contents.length - 1) {
      currentStep++;
      showStep(currentStep);
    }
  });

  document.getElementById("payment").addEventListener("click", async () => {
    const acceptTerms = document.getElementById("acceptTerm").checked;
    if (!acceptTerms) {
      alert("Please accept the Terms!");
      return;
    }

    await createRents();
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

  showStep(currentStep);
});
