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
  let selectedLocations = {
    startPoint: {
      lat: 38.8977,
      lng: -77.0365,
      address: "The White House, 1600 Pennsylvania Avenue NW, Washington, DC"
    },
    pickup: null,
    dropoffs: [],
  };
  let bookingData = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    selectedCar: null,
    carId: null,
    pickupLocation: "",
    pickupDateTime: "",
    pickupDate: "",
    pickupTime: "",
    returnPickupDateTime: "",
    numberOfPassengers: 0,
    childSeats: 0,
    boosterSeats: 0,
    isRoundTrip: false,
    promotionCode: "",
    pickupDistance: 0,
    returnDistance: 0,
    totalDistance: 0,
    dropoffPoints: [],
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

  // ============== coupon logic ================
  document.querySelector("#applyCouponBtn").addEventListener("click", function() {
    const couponInput = document.querySelector("#couponInput");
    const couponCode = couponInput.value.trim().toUpperCase();
    const discountElem = document.querySelector("#discountAmount");
    const totalElem = document.querySelector("#totalPrice");
    if (coupons[couponCode]) {
      bookingData.promotionCode = couponCode;
      if (discountElem) discountElem.textContent = `-${formattedPrice(coupons[couponCode])}`;
      if (totalElem && (bookingData.totalPrice >= coupons[couponCode])) totalElem.textContent = `${formattedPrice(bookingData.totalPrice - coupons[couponCode])}`;
    } else {
      alert("Invalid coupon code!");
      if (discountElem) discountElem.textContent = "-$0";
      if (totalElem) totalElem.textContent = `${formattedPrice(bookingData.totalPrice)}`;
      couponInput.focus();
    }
  })

  // ============== OSRM Distance Calculator ================
  async function calculateDistanceOSRM(lat1, lng1, lat2, lng2) {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const distanceMeters = data.routes[0].distance;
        return distanceMeters;
      }
      return 0;
    } catch (err) {
      console.error("OSRM Error:", err);
      return 0;
    }
  }

  async function calculateTotalDistances() {
    if (!selectedLocations.pickup || selectedLocations.dropoffs.length === 0) {
      return { distance: 0, pickupDistance: 0, returnDistance: 0 };
    }

    let totalDistance = 0;
    let pickupDistance = 0;
    let returnDistance = 0;

    // Calculate startPoint (White House) to pickup
    pickupDistance = await calculateDistanceOSRM(
      selectedLocations.startPoint.lat,
      selectedLocations.startPoint.lng,
      selectedLocations.pickup.lat,
      selectedLocations.pickup.lng
    );

    totalDistance += pickupDistance;

    // Calculate pickup to first dropoff
    pickupDistance = await calculateDistanceOSRM(
      selectedLocations.pickup.lat,
      selectedLocations.pickup.lng,
      selectedLocations.dropoffs[0].lat,
      selectedLocations.dropoffs[0].lng
    );

    totalDistance += pickupDistance;

    // Calculate distances between dropoff points
    for (let i = 0; i < selectedLocations.dropoffs.length - 1; i++) {
      const dist = await calculateDistanceOSRM(
        selectedLocations.dropoffs[i].lat,
        selectedLocations.dropoffs[i].lng,
        selectedLocations.dropoffs[i + 1].lat,
        selectedLocations.dropoffs[i + 1].lng
      );
      totalDistance += dist;
    }

    // If round trip, calculate return distance (last dropoff back to pickup)
    const isRoundTrip = document.getElementById("roundTrip")?.checked || false;
    if (isRoundTrip && selectedLocations.dropoffs.length > 0) {
      const lastDropoff =
        selectedLocations.dropoffs[selectedLocations.dropoffs.length - 1];
      returnDistance = await calculateDistanceOSRM(
        lastDropoff.lat,
        lastDropoff.lng,
        selectedLocations.pickup.lat,
        selectedLocations.pickup.lng
      );
      totalDistance += returnDistance;
    }

    // Convert meters to miles (1 mile = 1609.34 meters)
    const metersToMiles = (meters) => meters / 1609.34;

    return {
      distance: metersToMiles(totalDistance),
      pickupDistance: metersToMiles(pickupDistance),
      returnDistance: metersToMiles(returnDistance),
    };
  }

  // ============== Step Navigation ================
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

  // ============== API Calls ================
  async function callFindCarsBySeatsAPI() {
    try {
      const distances = await calculateTotalDistances();
      bookingData.totalDistance = distances.distance;
      bookingData.pickupDistance = distances.pickupDistance;
      bookingData.returnDistance = distances.returnDistance;

      const payload = {
        passengers: bookingData.numberOfPassengers,
        childSeats: bookingData.childSeats,
        boosterSeats: bookingData.boosterSeats,
        distance: distances.distance,
        pickupDistance: distances.pickupDistance,
        returnDistance: distances.returnDistance,
        isRoundTrip: bookingData.isRoundTrip,
        outboundPickupDateTime: bookingData.pickupDateTime,
        returnPickupDateTime: bookingData.returnPickupDateTime,
        promotionCode: "",
      };

      const res = await fetch(
        "https://machshuttle.hayho.org/api/cars/find-by-seats",
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

      if (data.success && data.data.length > 0) {
        renderCars(data.data);
        return data.data;
      } else {
        alert(data.message || "No cars available for the selected criteria.");
        return null;
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      return false;
    }
  }

  async function createBooking() {
    try {
      const payload = {
        firstName: bookingData.firstName,
        lastName: bookingData.lastName,
        email: bookingData.email,
        phone: bookingData.phone,
        carId: bookingData.carId,
        pickupLocation: bookingData.pickupLocation,
        pickupDateTime: bookingData.pickupDateTime,
        returnPickupDateTime: bookingData.returnPickupDateTime,
        numberOfPassengers: bookingData.numberOfPassengers,
        childSeats: bookingData.childSeats,
        boosterSeats: bookingData.boosterSeats,
        isRoundTrip: bookingData.isRoundTrip,
        promotionCode: bookingData.promotionCode,
        pickupDistance: bookingData.pickupDistance,
        returnDistance: bookingData.returnDistance,
        totalDistance: bookingData.totalDistance,
        dropoffPoints: bookingData.dropoffPoints,
      }
      const res = await fetch(
        "https://machshuttle.hayho.org/api/bookings/create",
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
        alert("Booking created successfully!");
      } else {
        alert(data.message || "Booking failed!");
      }
    } catch (err) {
      console.error("Booking Error:", err);
    }
  }

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
          <h3 class="car-name">${car.name || 0}</h3>
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
      userName.textContent = `${bookingData.firstName} ${bookingData.lastName}`;

    const phoneElem = step3Content.querySelector("#phone");
    if (phoneElem)
      phoneElem.innerHTML = `<img src="assests/svg/phone.svg" /> ${
        bookingData.phone || "N/A"
      }`;

    const emailElem = step3Content.querySelector("#email");
    if (emailElem)
      emailElem.innerHTML = `<img src="assests/svg/mail.svg" /> ${bookingData.email}`;

    const pickupLocationElem = step3Content.querySelector("#pickupLocation");
    if (pickupLocationElem && selectedLocations.pickup) {
      pickupLocationElem.innerHTML = `<strong class="text-pickup">Pick up location:</strong> ${selectedLocations.pickup.address}`;
    }

    const dropoffLocationElem = step3Content.querySelector("#dropoffLocation");
    if (dropoffLocationElem && selectedLocations.dropoffs && selectedLocations.dropoffs.length > 0) {
      const dropoffAddresses = selectedLocations.dropoffs.map(d => d.address).join(' - ');
      dropoffLocationElem.innerHTML = `<strong class="text-pickup">Drop off location:</strong> ${dropoffAddresses}`;
    }

    //Fill dates
    const pickupDateElem = step3Content.querySelector("#pickupDate");
    if (pickupDateElem && bookingData.pickupDate && bookingData.pickupTime) {
      const formattedDate = new Date(`${bookingData.pickupDate}T${bookingData.pickupTime}`).toLocaleString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
      pickupDateElem.innerHTML = `<strong class="text-pickup">Date of Service:</strong> ${formattedDate}`;
    }

    //Fill return date if round trip
    const isRoundTrip = document.getElementById("roundTrip").checked;
    if (isRoundTrip) {
      const roundTripTextElem = step3Content.querySelector("#roundTripText");
      if (roundTripTextElem) {
        roundTripTextElem.textContent = isRoundTrip ? "Round Trip" : "";
      }
    }

    // Fill selected car info
    const selectedCarRadio = document.querySelector(
      'input[name="selectedCar"]:checked'
    );
    if (selectedCarRadio) {
      const carCard = selectedCarRadio.closest(".car-card-item");
      bookingData.carId = parseInt(carCard.dataset.carId);
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

      const step3CarSeats = step3Content.querySelector(
        ".car-card .car-details span:first-child"
      );
      if (step3CarSeats)
        step3CarSeats.innerHTML = `<img src="assests/svg/seat.svg" />${carSeats}`;

      const step3CarBags = step3Content.querySelector(
        ".car-card .car-details span:last-child"
      );
      if (step3CarBags)
        step3CarBags.innerHTML = `<img src="assests/svg/bag.svg" />${carBags}`;

      // Update subtotal
      const subtotalElem = step3Content.querySelector("#subtotalPrice");
      if (subtotalElem) subtotalElem.textContent = carPrice;
      const boosterSeatPrice = step3Content.querySelector("#boosterSeatPrice");
      const boosterSeat = bookingData.boosterSeats * 10;
      if (boosterSeatPrice) boosterSeatPrice.textContent = formattedPrice(boosterSeat || 0);

      const subtotal = parseFloat(carPrice.replace(/[$,]/g, ""));
      const total = subtotal + boosterSeat;
      bookingData.totalPrice = total;

      const totalElem = step3Content.querySelector("#totalPrice");
      if (totalElem) totalElem.textContent = `${formattedPrice(total || 0)}`;
    }
  }

  // ============== VALIDATION ================
  function validateStep1() {
    const form = document.getElementById("tripForm");
    const requiredFields = [
      "pickupInput",
      "dropoffInput0",
      "fromDateInput",
      "fromTimeInput",
      "passengersInput",
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

    // Validate return date/time if round trip
    const isRoundTrip = document.getElementById("roundTrip").checked;
    if (isRoundTrip) {
      const returnDateInput = document.getElementById("returnDateInput");
      const returnTimeInput = document.getElementById("returnTimeInput");
      
      if (!returnDateInput?.value || !returnTimeInput?.value) {
        returnDateInput?.classList.add("is-invalid");
        returnTimeInput?.classList.add("is-invalid");
        valid = false;
      } else {
        returnDateInput.classList.remove("is-invalid");
        returnTimeInput.classList.remove("is-invalid");
        
        // Validate return must be after outbound
        const fromDate = document.getElementById("fromDateInput").value;
        const fromTime = document.getElementById("fromTimeInput").value;
        const outbound = new Date(`${fromDate}T${fromTime}`);
        const returnDT = new Date(`${returnDateInput.value}T${returnTimeInput.value}`);
        
        if (returnDT <= outbound) {
          returnDateInput.classList.add("is-invalid");
          returnTimeInput.classList.add("is-invalid");
          valid = false;
        }
      }
    }

    if (valid) {
      // Lưu dữ liệu step 1
      bookingData.numberOfPassengers =
        parseInt(document.getElementById("passengersInput").value) || 0;
      bookingData.childSeats =
        parseInt(document.getElementById("childSeatInput").value) || 0;
      bookingData.boosterSeats =
        parseInt(document.getElementById("boosterSeatInput").value) || 0;
      bookingData.isRoundTrip = document.getElementById("roundTrip").checked;

      const fromDate = document.getElementById("fromDateInput").value;
      const fromTime = document.getElementById("fromTimeInput").value;
      bookingData.pickupDate = fromDate;
      bookingData.pickupTime = fromTime;
      bookingData.pickupDateTime = new Date(`${fromDate}T${fromTime}`).toISOString();


      if (isRoundTrip) {
        const returnDate = document.getElementById("returnDateInput").value;
        const returnTime = document.getElementById("returnTimeInput").value;
        bookingData.returnPickupDateTime = new Date(`${returnDate}T${returnTime}`).toISOString();
      } else {
        bookingData.returnPickupDateTime = new Date(new Date(bookingData.pickupDateTime).getTime() + 24 * 60 * 60 * 1000).toISOString();
      }
      // Lưu dropoff points
      bookingData.dropoffPoints = selectedLocations.dropoffs.map(
        (loc, index) => ({
          location: loc.address,
          order: index + 1,
        })
      );
    }

    return valid;
  }

  function validateStep2() {
    const step2Content = contents[1];
    const firstName = step2Content.querySelector("#firstNameInput");
    const lastName = step2Content.querySelector("#lastNameInput");
    const email = step2Content.querySelector("#emailInput");
    const phone = step2Content.querySelector("#phoneInput");

    let valid = true;

    if (!firstName.value.trim()) {
      firstName.classList.add("is-invalid");
      valid = false;
    } else {
      firstName.classList.remove("is-invalid");
      bookingData.firstName = firstName.value.trim();
    }

    if (!lastName.value.trim()) {
      lastName.classList.add("is-invalid");
      valid = false;
    } else {
      lastName.classList.remove("is-invalid");
      bookingData.lastName = lastName.value.trim();
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim() || !emailRegex.test(email.value.trim())) {
      email.classList.add("is-invalid");
      valid = false;
    } else {
      email.classList.remove("is-invalid");
      bookingData.email = email.value.trim();
    }

    const phoneRegex = /^[\+]?1?[-.\s]?(\([0-9]{3}\)|[0-9]{3})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;
    if (!phone.value.trim() || !phoneRegex.test(phone.value.trim())) {
      phone.classList.add("is-invalid");
      valid = false;
    } else {
      phone.classList.remove("is-invalid");
      bookingData.phone = phone.value.trim();
    }

    if (!valid) {
      return false;
    }

    return true;
  }

  // Fill Step 3 with collected data

  // ============== Round Trip Toggle ================
  const roundTripCheckbox = document.getElementById("roundTrip");
  
  const returnDateTimeHTML = `
    <div class="col-md-4 return-date-section" style="display: none;">
      <label class="form-label text-light">
        Return Date <span class="text-danger">*</span>
      </label>
      <input
        type="date"
        id="returnDateInput"
        class="form-control custom-input"
      />
    </div>
    <div class="col-md-4 return-date-section" style="display: none;">
      <label class="form-label text-light">
        Return Time <span class="text-danger">*</span>
      </label>
      <input
        type="time"
        id="returnTimeInput"
        class="form-control custom-input"
      />
    </div>
  `;

  const airlineCol = document.querySelector(".col-md-4:has(#boosterSeatInput)");
  airlineCol.insertAdjacentHTML("afterend", returnDateTimeHTML);

  roundTripCheckbox.addEventListener("change", (e) => {
    const returnSections = document.querySelectorAll(".return-date-section");
    returnSections.forEach((section) => {
      section.style.display = e.target.checked ? "block" : "none";
    });

    // Clear return inputs if unchecked
    if (!e.target.checked) {
      const returnDateInput = document.getElementById("returnDateInput");
      const returnTimeInput = document.getElementById("returnTimeInput");
      if (returnDateInput) returnDateInput.value = "";
      if (returnTimeInput) returnTimeInput.value = "";
    }
  });

  // ============== Next/Back Buttons ================
  document.getElementById("nextBtn").addEventListener("click", async () => {
    if (!validateStep1()) return;

    if (!selectedLocations.pickup || selectedLocations.dropoffs.length === 0) {
      alert("Please select an address from the list of suggestions!");
      return false;
    } else {
      bookingData.pickupLocation = selectedLocations.pickup.address;
    }

    // Show loading
    const btn = document.getElementById("nextBtn");
    const originalText = btn.textContent;
    btn.textContent = "Loading...";
    btn.disabled = true;

    const seatCars = await callFindCarsBySeatsAPI();

    btn.textContent = originalText;
    btn.disabled = false;

    if (!seatCars) return;

    if (currentStep < contents.length - 1) {
      currentStep++;
      showStep(currentStep);
    }
  });

  document.getElementById("nextToPayment").addEventListener("click", () => {
    if (!validateStep2()) return;
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

    await createBooking();
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

  // ============== Add stop logic (Max 3 dropoffs) ================
  const dropoffList = document.getElementById("dropoffList");
  const addStopBtn = document.getElementById("addStop");
  const MAX_DROPOFFS = 3;

  function updateNumbers() {
    const items = dropoffList.querySelectorAll(".dropoff-item");
    items.forEach((item, index) => {
      const circle = item.querySelector(".circle-number");
      if (circle) circle.textContent = index + 1;
    });

    // Disable add button if max reached
    if (items.length >= MAX_DROPOFFS) {
      addStopBtn.disabled = true;
      addStopBtn.style.opacity = "0.5";
    } else {
      addStopBtn.disabled = false;
      addStopBtn.style.opacity = "1";
    }
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

    // Create new item
    const index = items.length;
    const newItem = document.createElement("div");
    newItem.className = "dropoff-item d-flex align-items-center adding";
    newItem.setAttribute("data-index", index);
    newItem.innerHTML = `
    <div class="input-wrapper position-relative flex-grow-1 has-number">
      <span class="circle-number">${index + 1}</span>
      <input
        type="text"
        class="form-control dropoff-input"
        id="dropoffInput${index}"
        placeholder="Enter Address, Point of Interest or Airport Code"
      />
      <div id="dropoffDropdown${index}" class="autocomplete-dropdown"></div>
    </div>
    <button type="button" class="btn remove-btn">−</button>
  `;

    dropoffList.appendChild(newItem);

    // Attach autocomplete
    const newInput = newItem.querySelector("input.dropoff-input");
    const newDropdown = newItem.querySelector(".autocomplete-dropdown");
    attachAutocomplete(newInput, newDropdown, index);

    // Animation
    requestAnimationFrame(() => {
      newItem.classList.add("show");
      newItem.classList.remove("adding");
    });

    // Remove button
    newItem.querySelector(".remove-btn").onclick = () => {
      newItem.classList.add("removing");
      newItem.addEventListener(
        "transitionend",
        () => {
          const itemIndex = parseInt(newItem.getAttribute("data-index"));
          selectedLocations.dropoffs.splice(itemIndex, 1);
          newItem.remove();

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
    };

    updateNumbers();
  });

  // ============== Autocomplete Logic ================
  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  async function searchUS(keyword) {
    if (!keyword) return [];
    try {
      const res = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: { q: keyword, format: "json", countrycodes: "us", limit: 5 },
          headers: { "User-Agent": "AutoRentalLocationSearch/1.0" },
        }
      );
      return res.data.map((i) => ({
        address: i.display_name,
        lat: parseFloat(i.lat),
        lng: parseFloat(i.lon),
      }));
    } catch (err) {
      console.error("Search error:", err);
      return [];
        }
}

  function attachAutocomplete(input, dropdown, dropoffIndex = null) {
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

          // Save location
          if (input.id === "pickupInput") {
            selectedLocations.pickup = chosen;
          } else if (dropoffIndex !== null) {
            selectedLocations.dropoffs[dropoffIndex] = chosen;
          }
        };
      });
    }, 300);

    input.addEventListener("input", handleSearch);
    input.addEventListener("focus", handleSearch);

    // Clear saved location if input changes manually
    input.addEventListener("blur", () => {
      setTimeout(() => {
        dropdown.innerHTML = "";
      }, 200);
    });
  }

  // ============== Initialize ================
  window.onload = () => {
    // Pick up
    attachAutocomplete(
      document.getElementById("pickupInput"),
      document.getElementById("pickupDropdown")
    );

    // Initial dropoff
    const initialDropoff = document.getElementById("dropoffInput0");
    if (initialDropoff) {
      attachAutocomplete(
        initialDropoff,
        document.getElementById("dropoffDropdown0"),
        0
      );
    }

    updateNumbers();
  };

  showStep(currentStep);
});
