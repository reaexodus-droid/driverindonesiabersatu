// ======================================================
// DRIVER MAPS
// Geoapify + MapLibre
// ======================================================


// ======================================================
// API KEY
// ======================================================

const GEOAPIFY_API_KEY =
    "4409fb031a5e49a191e1eacd8f40a26c";


// ======================================================
// DEFAULT LOCATION
// Jakarta
// ======================================================

const DEFAULT_LOCATION = [
    106.8456,
    -6.2088
];


// ======================================================
// GLOBAL
// ======================================================

let map;

let userMarker = null;

let selectedMarker = null;

let searchMarker = null;

let destinationMarker = null;

let accuracyCircle = null;

let watchId = null;

let tracking = false;

let selectedLocation = null;

let destination = null;

let routeGeoJSON = null;


// ======================================================
// INIT MAP
// ======================================================

function initMap() {

    map =
        new maplibregl.Map({

            container:
                "map",

            style:
                `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${GEOAPIFY_API_KEY}`,

            center:
                DEFAULT_LOCATION,

            zoom:
                12,

            attributionControl:
                true

        });


    // ==================================================
    // NAVIGATION
    // ==================================================

    map.addControl(

        new maplibregl.NavigationControl(),

        "bottom-right"

    );


    // ==================================================
    // MAP LOAD
    // ==================================================

    map.on(
        "load",
        () => {

            setupSearch();

            setupMapClick();

            setupButtons();

            loadSavedPoints();

        }
    );

}


// ======================================================
// SEARCH
// ======================================================

function setupSearch() {

    const geocoder =
        new MaplibreGeocoder(

            {

                forwardGeocode:
                    async function (
                        config
                    ) {

                        const query =
                            config.query.trim();


                        if (
                            !query
                        ) {

                            return {
                                features: []
                            };

                        }


                        try {

                            const params =
                                new URLSearchParams({

                                    text:
                                        query,

                                    apiKey:
                                        GEOAPIFY_API_KEY,

                                    format:
                                        "geojson",

                                    limit:
                                        8,

                                    lang:
                                        "id",

                                    filter:
                                        "countrycode:id"

                                });


                            // Bias berdasarkan posisi driver

                            if (
                                userMarker
                            ) {

                                const pos =
                                    userMarker
                                        .getLngLat();


                                params.set(

                                    "bias",

                                    `proximity:${pos.lng},${pos.lat}`

                                );

                            }


                            const response =
                                await fetch(

                                    `https://api.geoapify.com/v1/geocode/search?${params.toString()}`

                                );


                            if (
                                !response.ok
                            ) {

                                throw new Error(
                                    "Search API error"
                                );

                            }


                            const data =
                                await response.json();


                            return data;

                        }

                        catch (
                            error
                        ) {

                            console.error(
                                error
                            );

                            return {
                                features: []
                            };

                        }

                    }

            },


            {

                maplibregl

            }

        );


    geocoder.setLanguage(
        "id"
    );


    geocoder.setPlaceholder(
        "Cari alamat, tempat, jalan..."
    );


    document
        .getElementById(
            "search-box"
        )
        .appendChild(
            geocoder.onAdd(map)
        );


    // ==================================================
    // RESULT SELECT
    // ==================================================

    geocoder.on(

        "result",

        event => {

            const feature =
                event.result;


            if (
                !feature ||
                !feature.geometry
            ) {

                return;

            }


            const coords =
                feature.geometry.coordinates;


            const lng =
                coords[0];

            const lat =
                coords[1];


            const properties =
                feature.properties || {};


            selectedLocation = {

                lat,

                lng,

                name:
                    properties.name ||
                    properties.address_line1 ||
                    properties.formatted ||
                    "Lokasi",

                address:
                    properties.formatted ||
                    properties.address_line2 ||
                    "",

                placeId:
                    properties.place_id ||
                    null

            };


            // ==================================================
            // MAP
            // ==================================================

            map.flyTo({

                center:
                    [lng, lat],

                zoom:
                    17,

                duration:
                    1000

            });


            // ==================================================
            // SEARCH MARKER
            // ==================================================

            if (
                searchMarker
            ) {

                searchMarker.remove();

            }


            searchMarker =
                createMarker(

                    lng,

                    lat,

                    "#dc2626"

                );


            // ==================================================
            // PLACE CARD
            // ==================================================

            showPlaceCard(
                selectedLocation
            );

        }

    );

}


// ======================================================
// MAP CLICK
// ======================================================

function setupMapClick() {

    map.on(
        "click",
        async event => {

            const lng =
                event.lngLat.lng;

            const lat =
                event.lngLat.lat;


            selectCoordinate(
                lat,
                lng
            );


            // ==================================================
            // REVERSE GEOCODE
            // ==================================================

            try {

                const params =
                    new URLSearchParams({

                        lat,

                        lon:
                            lng,

                        format:
                            "json",

                        lang:
                            "id",

                        apiKey:
                            GEOAPIFY_API_KEY

                    });


                const response =
                    await fetch(

                        `https://api.geoapify.com/v1/geocode/reverse?${params.toString()}`

                    );


                if (
                    response.ok
                ) {

                    const data =
                        await response.json();


                    if (
                        data.results &&
                        data.results.length
                    ) {

                        const result =
                            data.results[0];


                        document
                            .getElementById(
                                "nama"
                            )
                            .value =
                            result.name ||
                            result.address_line1 ||
                            "Lokasi Baru";

                    }

                }

            }

            catch (
                error
            ) {

                console.error(
                    "Reverse geocoding:",
                    error
                );

            }

        }
    );

}


// ======================================================
// SELECT COORDINATE
// ======================================================

function selectCoordinate(
    lat,
    lng
) {

    document
        .getElementById("point-panel")
        .classList
        .remove("hidden");


    document
        .getElementById("lat")
        .value =
        lat.toFixed(6);


    document
        .getElementById("lng")
        .value =
        lng.toFixed(6);


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


// ======================================================
// CREATE MARKER
// ======================================================

function createMarker(
    lng,
    lat,
    color
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "custom-marker";


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
        "0 2px 8px rgba(0,0,0,.35)";


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


// ======================================================
// CREATE DRIVER MARKER
// ======================================================

function createDriverMarker(
    lng,
    lat
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "driver-marker";


    element.style.width =
        "22px";

    element.style.height =
        "22px";

    element.style.borderRadius =
        "50%";

    element.style.background =
        "#4285F4";

    element.style.border =
        "4px solid white";

    element.style.boxShadow =
        `
        0 2px 8px
        rgba(0,0,0,.4)
        `;


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


// ======================================================
// SHOW PLACE
// ======================================================

function showPlaceCard(
    place
) {

    document
        .getElementById(
            "place-name"
        )
        .textContent =
        place.name;


    document
        .getElementById(
            "place-address"
        )
        .textContent =
        place.address;


    document
        .getElementById(
            "place-coordinates"
        )
        .textContent =
        `${place.lat.toFixed(6)}, ${place.lng.toFixed(6)}`;


    document
        .getElementById(
            "place-card"
        )
        .classList
        .remove("hidden");

}


// ======================================================
// USE PLACE AS DESTINATION
// ======================================================

function usePlaceAsDestination() {

    if (
        !selectedLocation
    ) {

        return;

    }


    destination = {

        lat:
            selectedLocation.lat,

        lng:
            selectedLocation.lng,

        name:
            selectedLocation.name,

        address:
            selectedLocation.address

    };


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


    destinationMarker
        .setPopup(

            new maplibregl.Popup()
                .setHTML(`

                    <strong>
                        Tujuan
                    </strong>

                    <br>

                    ${escapeHTML(
                        destination.name
                    )}

                `)

        );


    hidePlaceCard();


    // Kalau GPS sudah aktif
    // langsung hitung rute

    if (
        userMarker
    ) {

        calculateRoute();

    }

}


// ======================================================
// SAVE PLACE
// ======================================================

function savePlaceFromSearch() {

    if (
        !selectedLocation
    ) {

        return;

    }


    document
        .getElementById("point-panel")
        .classList
        .remove("hidden");


    document
        .getElementById("nama")
        .value =
        selectedLocation.name;


    document
        .getElementById("lat")
        .value =
        selectedLocation.lat
            .toFixed(6);


    document
        .getElementById("lng")
        .value =
        selectedLocation.lng
            .toFixed(6);


    hidePlaceCard();

}


// ======================================================
// GPS
// ======================================================

function locateUser() {

    if (
        !navigator.geolocation
    ) {

        alert(
            "Browser tidak mendukung GPS."
        );

        return;

    }


    setGPSStatus(
        "Mencari GPS...",
        false
    );


    navigator.geolocation.getCurrentPosition(

        position => {

            updateUserPosition(
                position
            );


            const lat =
                position.coords.latitude;

            const lng =
                position.coords.longitude;


            map.flyTo({

                center:
                    [lng, lat],

                zoom:
                    17,

                duration:
                    1000

            });


            startTracking();


        },


        error => {

            console.error(
                error
            );


            setGPSStatus(
                "GPS gagal",
                false
            );


            alert(
                gpsError(
                    error
                )
            );

        },


        {

            enableHighAccuracy:
                true,

            timeout:
                15000,

            maximumAge:
                0

        }

    );

}


// ======================================================
// START TRACKING
// ======================================================

function startTracking() {

    if (
        tracking
    ) {

        return;

    }


    tracking =
        true;


    watchId =
        navigator.geolocation.watchPosition(

            position => {

                updateUserPosition(
                    position
                );

            },


            error => {

                console.error(
                    "GPS tracking:",
                    error
                );

            },


            {

                enableHighAccuracy:
                    true,

                maximumAge:
                    2000,

                timeout:
                    15000

            }

        );

}


// ======================================================
// UPDATE USER
// ======================================================

function updateUserPosition(
    position
) {

    const lat =
        position.coords.latitude;

    const lng =
        position.coords.longitude;

    const accuracy =
        position.coords.accuracy;


    // ==================================================
    // DRIVER MARKER
    // ==================================================

    if (
        !userMarker
    ) {

        userMarker =
            createDriverMarker(
                lng,
                lat
            );

    }

    else {

        userMarker
            .setLngLat([
                lng,
                lat
            ]);

    }


    // ==================================================
    // ACCURACY
    // ==================================================

    updateAccuracyCircle(
        lat,
        lng,
        accuracy
    );


    // ==================================================
    // STATUS
    // ==================================================

    setGPSStatus(

        `GPS aktif • ±${Math.round(accuracy)} m`,

        true

    );


    // ==================================================
    // ROUTE UPDATE
    // ==================================================

    if (
        destination
    ) {

        calculateRoute();

    }

}


// ======================================================
// ACCURACY CIRCLE
// ======================================================

function updateAccuracyCircle(
    lat,
    lng,
    radius
) {

    if (
        !accuracyCircle
    ) {

        accuracyCircle =
            new maplibregl.CircleMarker({

                // tidak dipakai
            });

    }


    // Hapus versi sebelumnya
    // dan buat circle GeoJSON

    const sourceId =
        "gps-accuracy";


    const layerId =
        "gps-accuracy-layer";


    const data = {

        type:
            "FeatureCollection",

        features: [

            {

                type:
                    "Feature",

                geometry: {

                    type:
                        "Point",

                    coordinates:
                        [lng, lat]

                }

            }

        ]

    };


    if (
        map.getSource(
            sourceId
        )
    ) {

        map.getSource(
            sourceId
        )
        .setData(data);

    }

    else {

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
                layerId,

            type:
                "circle",

            source:
                sourceId,

            paint: {

                "circle-radius":
                    18,

                "circle-color":
                    "#4285F4",

                "circle-opacity":
                    0.10,

                "circle-stroke-color":
                    "#4285F4",

                "circle-stroke-opacity":
                    0.30,

                "circle-stroke-width":
                    1

            }

        });

    }

}


// ======================================================
// ROUTING
// ======================================================

async function calculateRoute() {

    if (
        !userMarker ||
        !destination
    ) {

        return;

    }


    const driver =
        userMarker.getLngLat();


    const from =
        `${driver.lat},${driver.lng}`;


    const to =
        `${destination.lat},${destination.lng}`;


    try {

        const params =
            new URLSearchParams({

                waypoints:
                    `${from}|${to}`,

                mode:
                    "drive",

                format:
                    "geojson",

                apiKey:
                    GEOAPIFY_API_KEY

            });


        const response =
            await fetch(

                `https://api.geoapify.com/v1/routing?${params.toString()}`

            );


        if (
            !response.ok
        ) {

            throw new Error(
                "Routing error"
            );

        }


        const data =
            await response.json();


        if (
            !data.features ||
            !data.features.length
        ) {

            return;

        }


        routeGeoJSON =
            data;


        // ==================================================
        // DRAW ROUTE
        // ==================================================

        drawRoute(
            data
        );


        // ==================================================
        // INFO
        // ==================================================

        const properties =
            data.features[0]
                .properties;


        const distance =
            properties.distance || 0;


        const time =
            properties.time || 0;


        showRouteInfo(
            distance,
            time
        );

    }

    catch (
        error
    ) {

        console.error(
            "Route error:",
            error
        );

    }

}


// ======================================================
// DRAW ROUTE
// ======================================================

function drawRoute(
    geojson
) {

    const sourceId =
        "route";


    if (
        map.getSource(
            sourceId
        )
    ) {

        map.getSource(
            sourceId
        )
        .setData(
            geojson
        );

    }

    else {

        map.addSource(

            sourceId,

            {

                type:
                    "geojson",

                data:
                    geojson

            }

        );


        map.addLayer({

            id:
                "route-line",

            type:
                "line",

            source:
                sourceId,

            layout: {

                "line-join":
                    "round",

                "line-cap":
                    "round"

            },

            paint: {

                "line-color":
                    "#2563eb",

                "line-width":
                    6,

                "line-opacity":
                    0.85

            }

        });

    }

}


// ======================================================
// ROUTE INFO
// ======================================================

function showRouteInfo(
    distance,
    time
) {

    const km =
        distance / 1000;


    const minutes =
        Math.ceil(
            time / 60
        );


    document
        .getElementById(
            "route-distance"
        )
        .textContent =
        `${km.toFixed(1)} km`;


    document
        .getElementById(
            "route-time"
        )
        .textContent =
        `${minutes} menit`;


    document
        .getElementById(
            "route-card"
        )
        .classList
        .remove("hidden");

}


// ======================================================
// SAVE POINT
// ======================================================

function savePoint() {

    const nama =
        document
            .getElementById(
                "nama"
            )
            .value
            .trim();


    const lat =
        parseFloat(

            document
                .getElementById(
                    "lat"
                )
                .value

        );


    const lng =
        parseFloat(

            document
                .getElementById(
                    "lng"
                )
                .value

        );


    const status =
        document
            .getElementById(
                "status"
            )
            .value;


    const keterangan =
        document
            .getElementById(
                "keterangan"
            )
            .value
            .trim();


    if (
        !nama
    ) {

        alert(
            "Nama lokasi belum diisi."
        );

        return;

    }


    if (
        Number.isNaN(lat) ||
        Number.isNaN(lng)
    ) {

        alert(
            "Koordinat belum dipilih."
        );

        return;

    }


    const point = {

        id:
            Date.now(),

        nama,

        lat,

        lng,

        status,

        keterangan

    };


    const points =
        getPoints();


    points.push(
        point
    );


    localStorage.setItem(

        "driver_points",

        JSON.stringify(
            points
        )

    );


    addSavedMarker(
        point
    );


    if (
        selectedMarker
    ) {

        selectedMarker.remove();

        selectedMarker =
            null;

    }


    resetPointForm();


    alert(
        "Titik berhasil disimpan."
    );

}


// ======================================================
// GET POINTS
// ======================================================

function getPoints() {

    try {

        return JSON.parse(

            localStorage.getItem(
                "driver_points"
            )

        ) || [];

    }

    catch {

        return [];

    }

}


// ======================================================
// LOAD POINTS
// ======================================================

function loadSavedPoints() {

    const points =
        getPoints();


    points.forEach(
        point => {

            addSavedMarker(
                point
            );

        }
    );

}


// ======================================================
// ADD SAVED MARKER
// ======================================================

function addSavedMarker(
    point
) {

    let color =
        "#ef4444";


    if (
        point.status ===
        "Asli"
    ) {

        color =
            "#22c55e";

    }


    if (
        point.status ===
        "Survey"
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


    const popup =
        new maplibregl.Popup({

            offset:
                15

        })


        .setHTML(`

            <div style="
                min-width:220px;
            ">

                <strong>
                    ${escapeHTML(
                        point.nama
                    )}
                </strong>

                <br><br>

                <b>Status:</b>

                ${escapeHTML(
                    point.status
                )}

                <br>

                <b>Latitude:</b>

                ${point.lat.toFixed(6)}

                <br>

                <b>Longitude:</b>

                ${point.lng.toFixed(6)}

                ${
                    point.keterangan
                    ?
                    `

                    <br><br>

                    <b>Keterangan:</b>

                    <br>

                    ${escapeHTML(
                        point.keterangan
                    )}

                    `
                    :
                    ""
                }

            </div>

        `);


    marker.setPopup(
        popup
    );

}


// ======================================================
// BUTTONS
// ======================================================

function setupButtons() {


    // GPS

    document
        .getElementById(
            "location-btn"
        )
        .addEventListener(

            "click",

            locateUser

        );


    // ADD

    document
        .getElementById(
            "add-btn"
        )
        .addEventListener(

            "click",

            () => {

                document
                    .getElementById(
                        "point-panel"
                    )
                    .classList
                    .remove(
                        "hidden"
                    );

            }

        );


    // CLOSE PANEL

    document
        .getElementById(
            "close-panel"
        )
        .addEventListener(

            "click",

            () => {

                document
                    .getElementById(
                        "point-panel"
                    )
                    .classList
                    .add(
                        "hidden"
                    );

            }

        );


    // SAVE

    document
        .getElementById(
            "save-point"
        )
        .addEventListener(

            "click",

            savePoint

        );


    // USE SEARCH RESULT

    document
        .getElementById(
            "use-place-btn"
        )
        .addEventListener(

            "click",

            usePlaceAsDestination

        );


    // SAVE SEARCH RESULT

    document
        .getElementById(
            "save-place-btn"
        )
        .addEventListener(

            "click",

            savePlaceFromSearch

        );


    // CLOSE PLACE

    document
        .getElementById(
            "close-place"
        )
        .addEventListener(

            "click",

            hidePlaceCard

        );


    // ROUTE

    document
        .getElementById(
            "route-btn"
        )
        .addEventListener(

            "click",

            () => {

                if (
                    !destination
                ) {

                    alert(
                        "Cari lokasi terlebih dahulu dan pilih 'Gunakan sebagai Tujuan'."
                    );

                    return;

                }


                if (
                    !userMarker
                ) {

                    alert(
                        "Aktifkan GPS terlebih dahulu."
                    );

                    return;

                }


                calculateRoute();

            }

        );


    // CLOSE ROUTE

    document
        .getElementById(
            "close-route"
        )
        .addEventListener(

            "click",

            () => {

                document
                    .getElementById(
                        "route-card"
                    )
                    .classList
                    .add(
                        "hidden"
                    );

            }

        );

}


// ======================================================
// HIDE PLACE
// ======================================================

function hidePlaceCard() {

    document
        .getElementById(
            "place-card"
        )
        .classList
        .add(
            "hidden"
        );

}


// ======================================================
// RESET FORM
// ======================================================

function resetPointForm() {

    document
        .getElementById(
            "nama"
        )
        .value =
        "";


    document
        .getElementById(
            "lat"
        )
        .value =
        "";


    document
        .getElementById(
            "lng"
        )
        .value =
        "";


    document
        .getElementById(
            "keterangan"
        )
        .value =
        "";


    document
        .getElementById(
            "status"
        )
        .value =
        "Fiktif";


    document
        .getElementById(
            "point-panel"
        )
        .classList
        .add(
            "hidden"
        );

}


// ======================================================
// GPS STATUS
// ======================================================

function setGPSStatus(
    text,
    active
) {

    document
        .getElementById(
            "gps-text"
        )
        .textContent =
        text;


    const element =
        document
            .getElementById(
                "gps-status"
            );


    if (
        active
    ) {

        element
            .classList
            .add(
                "active"
            );

    }

    else {

        element
            .classList
            .remove(
                "active"
            );

    }

}


// ======================================================
// GPS ERROR
// ======================================================

function gpsError(
    error
) {

    if (
        error.code === 1
    ) {

        return (
            "Izin lokasi ditolak. " +
            "Izinkan akses GPS pada browser."
        );

    }


    if (
        error.code === 2
    ) {

        return (
            "Lokasi tidak tersedia."
        );

    }


    if (
        error.code === 3
    ) {

        return (
            "GPS timeout. Coba lagi."
        );

    }


    return (
        "Tidak dapat mendapatkan lokasi."
    );

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(
    text
) {

    return String(
        text
    )

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


// ======================================================
// START
// ======================================================

window.addEventListener(

    "load",

    initMap

);