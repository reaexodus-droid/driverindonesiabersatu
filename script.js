// =====================================================
// GEOAPIFY DRIVER MAP
// =====================================================

const GEOAPIFY_API_KEY =
    "4409fb031a5e49a191e1eacd8f40a26c";


const DEFAULT_CENTER = [
    106.8456,
    -6.2088
];


let map;

let driverMarker = null;

let driverAccuracySource = null;

let selectedMarker = null;

let destinationMarker = null;

let destination = null;

let selectedPlace = null;

let gpsWatchId = null;

let searchTimer = null;


// =====================================================
// INIT
// =====================================================

function init() {

    map = new maplibregl.Map({

        container: "map",

        style:
            `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${GEOAPIFY_API_KEY}`,

        center:
            DEFAULT_CENTER,

        zoom:
            12,

        attributionControl:
            true

    });


    map.addControl(

        new maplibregl.NavigationControl(),

        "bottom-right"

    );


    map.on(
        "load",
        () => {

            setupSearch();

            setupMapClick();

            setupButtons();

        }
    );


    map.on(
        "error",
        event => {

            console.error(
                "MAP ERROR:",
                event
            );

        }
    );

}


// =====================================================
// SEARCH
// =====================================================

function setupSearch() {

    const input =
        document.getElementById(
            "searchInput"
        );


    const clear =
        document.getElementById(
            "clearSearch"
        );


    input.addEventListener(
        "input",
        () => {

            const text =
                input.value.trim();


            clear.style.display =
                text
                    ? "block"
                    : "none";


            clearTimeout(
                searchTimer
            );


            if (
                text.length < 2
            ) {

                hideSearchResults();

                return;

            }


            searchTimer =
                setTimeout(
                    () => {

                        searchLocation(
                            text
                        );

                    },
                    350
                );

        }
    );


    clear.addEventListener(
        "click",
        () => {

            input.value = "";

            clear.style.display =
                "none";

            hideSearchResults();

            input.focus();

        }
    );


    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                const text =
                    input.value.trim();


                if (
                    text
                ) {

                    searchLocation(
                        text
                    );

                }

            }

        }
    );

}


// =====================================================
// SEARCH API
// =====================================================

async function searchLocation(
    query
) {

    showSearchLoading();


    const params =
        new URLSearchParams({

            text:
                query,

            apiKey:
                GEOAPIFY_API_KEY,

            format:
                "json",

            limit:
                "8",

            lang:
                "id",

            filter:
                "countrycode:id"

        });


    // Prioritaskan lokasi
    // sekitar driver

    if (
        driverMarker
    ) {

        const pos =
            driverMarker
                .getLngLat();


        params.set(

            "bias",

            `proximity:${pos.lng},${pos.lat}`

        );

    }


    try {

        const response =
            await fetch(

                `https://api.geoapify.com/v1/geocode/search?${params.toString()}`

            );


        if (
            !response.ok
        ) {

            throw new Error(
                "Geoapify search error"
            );

        }


        const data =
            await response.json();


        showSearchResults(
            data.results || []
        );

    }

    catch (
        error
    ) {

        console.error(
            error
        );


        showSearchError();

    }

}


// =====================================================
// SEARCH RESULTS
// =====================================================

function showSearchResults(
    results
) {

    const container =
        document.getElementById(
            "searchResults"
        );


    container.innerHTML = "";


    if (
        !results.length
    ) {

        container.innerHTML = `

            <div class="search-result">

                <div class="result-name">
                    Lokasi tidak ditemukan
                </div>

                <div class="result-address">
                    Coba gunakan nama jalan,
                    tempat, atau alamat yang lebih lengkap.
                </div>

            </div>

        `;

        return;

    }


    results.forEach(
        result => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "search-result";


            const name =
                result.name ||
                result.address_line1 ||
                "Lokasi";


            const address =
                result.formatted ||
                result.address_line2 ||
                "";


            button.innerHTML = `

                <div class="result-name">
                    ${escapeHTML(name)}
                </div>

                <div class="result-address">
                    ${escapeHTML(address)}
                </div>

            `;


            button.addEventListener(
                "click",
                () => {

                    selectSearchResult(
                        result
                    );

                }
            );


            container.appendChild(
                button
            );

        }
    );

}


function showSearchLoading() {

    const container =
        document.getElementById(
            "searchResults"
        );


    container.innerHTML = `

        <div class="search-result">

            <div class="result-name">
                Mencari...
            </div>

        </div>

    `;

}


function showSearchError() {

    const container =
        document.getElementById(
            "searchResults"
        );


    container.innerHTML = `

        <div class="search-result">

            <div class="result-name">
                Gagal mencari lokasi
            </div>

            <div class="result-address">
                Periksa API key dan koneksi internet.
            </div>

        </div>

    `;

}


function hideSearchResults() {

    document.getElementById(
        "searchResults"
    ).innerHTML = "";

}


// =====================================================
// SELECT SEARCH RESULT
// =====================================================

function selectSearchResult(
    result
) {

    const lat =
        Number(
            result.lat
        );


    const lng =
        Number(
            result.lon
        );


    selectedPlace = {

        name:
            result.name ||
            result.address_line1 ||
            "Lokasi",

        address:
            result.formatted ||
            "",

        lat,

        lng

    };


    map.flyTo({

        center: [
            lng,
            lat
        ],

        zoom:
            17,

        duration:
            1000

    });


    if (
        selectedMarker
    ) {

        selectedMarker.remove();

    }


    selectedMarker =
        createMarker(

            lng,
            lat,

            "#ef4444"

        );


    showPlaceCard(
        selectedPlace
    );


    hideSearchResults();


    document.getElementById(
        "searchInput"
    ).blur();

}


// =====================================================
// PLACE CARD
// =====================================================

function showPlaceCard(
    place
) {

    document.getElementById(
        "placeName"
    ).textContent =
        place.name;


    document.getElementById(
        "placeAddress"
    ).textContent =
        place.address;


    document.getElementById(
        "placeCoordinates"
    ).textContent =

        `${place.lat.toFixed(6)}, ${place.lng.toFixed(6)}`;


    document.getElementById(
        "placeCard"
    ).classList.remove(
        "hidden"
    );

}


function hidePlaceCard() {

    document.getElementById(
        "placeCard"
    ).classList.add(
        "hidden"
    );

}


// =====================================================
// MAP CLICK
// =====================================================

function setupMapClick() {

    map.on(
        "click",
        async event => {

            const lat =
                event.lngLat.lat;

            const lng =
                event.lngLat.lng;


            openPointPanel(
                lat,
                lng
            );


            reverseGeocode(
                lat,
                lng
            );

        }
    );

}


// =====================================================
// REVERSE GEOCODING
// =====================================================

async function reverseGeocode(
    lat,
    lng
) {

    try {

        const params =
            new URLSearchParams({

                lat,

                lon:
                    lng,

                apiKey:
                    GEOAPIFY_API_KEY,

                lang:
                    "id"

            });


        const response =
            await fetch(

                `https://api.geoapify.com/v1/geocode/reverse?${params.toString()}`

            );


        if (
            !response.ok
        ) {

            return;

        }


        const data =
            await response.json();


        if (
            data.features &&
            data.features.length
        ) {

            const result =
                data.features[0].properties;


            document.getElementById(
                "pointName"
            ).value =

                result.name ||
                result.address_line1 ||
                "Lokasi Baru";

        }

    }

    catch (
        error
    ) {

        console.error(
            error
        );

    }

}


// =====================================================
// OPEN POINT PANEL
// =====================================================

function openPointPanel(
    lat,
    lng
) {

    document.getElementById(
        "pointLat"
    ).value =
        lat.toFixed(6);


    document.getElementById(
        "pointLng"
    ).value =
        lng.toFixed(6);


    document.getElementById(
        "pointPanel"
    ).classList.remove(
        "hidden"
    );


    if (
        selectedMarker
    ) {

        selectedMarker.remove();

    }


    selectedMarker =
        createMarker(

            lng,
            lat,

            "#2563eb"

        );

}


// =====================================================
// CREATE MARKER
// =====================================================

function createMarker(
    lng,
    lat,
    color
) {

    const element =
        document.createElement(
            "div"
        );


    element.style.width =
        "24px";

    element.style.height =
        "24px";

    element.style.borderRadius =
        "50%";

    element.style.background =
        color;

    element.style.border =
        "4px solid white";

    element.style.boxShadow =
        "0 2px 10px rgba(0,0,0,.35)";


    return new maplibregl.Marker({

        element,

        anchor:
            "center"

    })

    .setLngLat([
        lng,
        lat
    ])

    .addTo(map);

}


// =====================================================
// GPS
// =====================================================

function startGPS() {

    if (
        !navigator.geolocation
    ) {

        setGPSStatus(
            "GPS tidak didukung browser",
            false
        );

        return;

    }


    setGPSStatus(
        "Meminta izin GPS...",
        false
    );


    navigator.geolocation.getCurrentPosition(

        position => {

            updateDriverPosition(
                position
            );


            map.flyTo({

                center: [

                    position.coords.longitude,

                    position.coords.latitude

                ],

                zoom:
                    17,

                duration:
                    1000

            });


            startGPSWatch();

        },

        error => {

            console.error(
                "GPS ERROR",
                error
            );


            if (
                error.code === 1
            ) {

                setGPSStatus(
                    "Izin GPS ditolak",
                    false
                );

                alert(
                    "Izin lokasi ditolak. Silakan izinkan lokasi untuk website ini di pengaturan browser."
                );

            }

            else if (
                error.code === 2
            ) {

                setGPSStatus(
                    "Lokasi tidak tersedia",
                    false
                );

            }

            else if (
                error.code === 3
            ) {

                setGPSStatus(
                    "GPS timeout",
                    false
                );

            }

        },

        {

            enableHighAccuracy:
                true,

            timeout:
                20000,

            maximumAge:
                0

        }

    );

}


// =====================================================
// WATCH GPS
// =====================================================

function startGPSWatch() {

    if (
        gpsWatchId !== null
    ) {

        navigator.geolocation.clearWatch(
            gpsWatchId
        );

    }


    gpsWatchId =
        navigator.geolocation.watchPosition(

            position => {

                updateDriverPosition(
                    position
                );

            },

            error => {

                console.error(
                    error
                );

            },

            {

                enableHighAccuracy:
                    true,

                timeout:
                    20000,

                maximumAge:
                    2000

            }

        );

}


// =====================================================
// UPDATE DRIVER
// =====================================================

function updateDriverPosition(
    position
) {

    const lat =
        position.coords.latitude;

    const lng =
        position.coords.longitude;

    const accuracy =
        position.coords.accuracy;


    if (
        !driverMarker
    ) {

        driverMarker =
            createDriverMarker(
                lng,
                lat
            );

    }

    else {

        driverMarker
            .setLngLat([
                lng,
                lat
            ]);

    }


    setGPSStatus(

        `GPS aktif • ±${Math.round(accuracy)} m`,

        true

    );


    updateAccuracy(
        lat,
        lng
    );

}


// =====================================================
// DRIVER MARKER
// =====================================================

function createDriverMarker(
    lng,
    lat
) {

    const element =
        document.createElement(
            "div"
        );


    element.style.width =
        "22px";

    element.style.height =
        "22px";

    element.style.borderRadius =
        "50%";

    element.style.background =
        "#4285f4";

    element.style.border =
        "4px solid white";

    element.style.boxShadow =
        "0 2px 10px rgba(0,0,0,.35)";


    return new maplibregl.Marker({

        element,

        anchor:
            "center"

    })

    .setLngLat([
        lng,
        lat
    ])

    .addTo(map);

}


// =====================================================
// GPS ACCURACY
// =====================================================

function updateAccuracy(
    lat,
    lng
) {

    const sourceId =
        "gps-position";


    const data = {

        type:
            "Feature",

        geometry: {

            type:
                "Point",

            coordinates: [
                lng,
                lat
            ]

        }

    };


    if (
        map.getSource(
            sourceId
        )
    ) {

        map.getSource(
            sourceId
        ).setData(
            data
        );

        return;

    }


    map.addSource(

        sourceId,

        {

            type:
                "geojson",

            data

        }

    );


    map.addLayer({

        id:
            "gps-accuracy",

        type:
            "circle",

        source:
            sourceId,

        paint: {

            "circle-radius":
                25,

            "circle-color":
                "#4285f4",

            "circle-opacity":
                0.10,

            "circle-stroke-color":
                "#4285f4",

            "circle-stroke-opacity":
                0.25,

            "circle-stroke-width":
                1

        }

    });

}


// =====================================================
// GPS STATUS
// =====================================================

function setGPSStatus(
    text,
    active
) {

    document.getElementById(
        "gpsText"
    ).textContent =
        text;


    const status =
        document.getElementById(
            "gpsStatus"
        );


    if (
        active
    ) {

        status.classList.add(
            "active"
        );

    }

    else {

        status.classList.remove(
            "active"
        );

    }

}


// =====================================================
// BUTTONS
// =====================================================

function setupButtons() {

    document.getElementById(
        "gpsButton"
    ).addEventListener(
        "click",
        startGPS
    );


    document.getElementById(
        "addButton"
    ).addEventListener(
        "click",
        () => {

            document.getElementById(
                "pointPanel"
            ).classList.remove(
                "hidden"
            );

        }
    );


    document.getElementById(
        "closePanel"
    ).addEventListener(
        "click",
        closePointPanel
    );


    document.getElementById(
        "closePlace"
    ).addEventListener(
        "click",
        hidePlaceCard
    );


    document.getElementById(
        "destinationButton"
    ).addEventListener(
        "click",
        setDestination
    );


    document.getElementById(
        "saveLocationButton"
    ).addEventListener(
        "click",
        saveSearchLocation
    );


    document.getElementById(
        "savePoint"
    ).addEventListener(
        "click",
        savePoint
    );

}


// =====================================================
// SET DESTINATION
// =====================================================

function setDestination() {

    if (
        !selectedPlace
    ) {

        return;

    }


    destination =
        selectedPlace;


    if (
        destinationMarker
    ) {

        destinationMarker.remove();

    }


    destinationMarker =
        createMarker(

            destination.lng,

            destination.lat,

            "#16a34a"

        );


    hidePlaceCard();


    alert(
        "Tujuan berhasil dipilih."
    );

}


// =====================================================
// SAVE SEARCH LOCATION
// =====================================================

function saveSearchLocation() {

    if (
        !selectedPlace
    ) {

        return;

    }


    document.getElementById(
        "pointName"
    ).value =
        selectedPlace.name;


    document.getElementById(
        "pointLat"
    ).value =
        selectedPlace.lat.toFixed(6);


    document.getElementById(
        "pointLng"
    ).value =
        selectedPlace.lng.toFixed(6);


    document.getElementById(
        "pointPanel"
    ).classList.remove(
        "hidden"
    );


    hidePlaceCard();

}


// =====================================================
// SAVE POINT
// =====================================================

function savePoint() {

    const name =
        document.getElementById(
            "pointName"
        ).value.trim();


    const lat =
        Number(
            document.getElementById(
                "pointLat"
            ).value
        );


    const lng =
        Number(
            document.getElementById(
                "pointLng"
            ).value
        );


    const status =
        document.getElementById(
            "pointStatus"
        ).value;


    const description =
        document.getElementById(
            "pointDescription"
        ).value.trim();


    if (
        !name
    ) {

        alert(
            "Nama lokasi belum diisi."
        );

        return;

    }


    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
    ) {

        alert(
            "Koordinat belum dipilih."
        );

        return;

    }


    const point = {

        id:
            Date.now(),

        name,

        lat,

        lng,

        status,

        description

    };


    const points =
        JSON.parse(

            localStorage.getItem(
                "driverPoints"
            ) || "[]"

        );


    points.push(
        point
    );


    localStorage.setItem(

        "driverPoints",

        JSON.stringify(
            points
        )

    );


    addSavedPoint(
        point
    );


    closePointPanel();


    alert(
        "Titik berhasil disimpan."
    );

}


// =====================================================
// ADD SAVED POINT
// =====================================================

function addSavedPoint(
    point
) {

    let color =
        "#ef4444";


    if (
        point.status === "Asli"
    ) {

        color =
            "#22c55e";

    }


    if (
        point.status === "Survey"
    ) {

        color =
            "#3b82f6";

    }


    const marker =
        createMarker(

            point.lng,

            point.lat,

            color

        );


    marker.setPopup(

        new maplibregl.Popup({
            offset: 15
        })

        .setHTML(`

            <strong>
                ${escapeHTML(point.name)}
            </strong>

            <br><br>

            <b>Status:</b>
            ${escapeHTML(point.status)}

            <br>

            <b>Koordinat:</b>

            ${point.lat.toFixed(6)},
            ${point.lng.toFixed(6)}

            ${
                point.description
                ?
                `
                <br><br>

                <b>Keterangan:</b>

                <br>

                ${escapeHTML(point.description)}
                `
                :
                ""
            }

        `)

    );

}


// =====================================================
// CLOSE PANEL
// =====================================================

function closePointPanel() {

    document.getElementById(
        "pointPanel"
    ).classList.add(
        "hidden"
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(
    text
) {

    return String(text)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// =====================================================
// START
// =====================================================

window.addEventListener(
    "load",
    init
);
