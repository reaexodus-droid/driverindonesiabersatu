/* =====================================================
   GOOGLE MAPS
===================================================== */

let map = null;

let searchAutocomplete = null;

let driverMarker = null;

let selectedMarker = null;

let selectedCoordinate = null;

let gpsWatchId = null;


/* =====================================================
   INIT MAP

   Google Maps memanggil fungsi ini melalui:
   callback=initMap
===================================================== */

window.initMap = function () {

    console.log(
        "Google Maps berhasil dimuat."
    );


    map = new google.maps.Map(

        document.getElementById(
            "map"
        ),

        {

            center: {

                lat: -6.2088,

                lng: 106.8456

            },

            zoom: 13,

            mapTypeControl: false,

            streetViewControl: false,

            fullscreenControl: true,

            clickableIcons: true

        }

    );


    setupSearch();

    setupMapClick();

    setupButtons();

    loadSavedPoints();

};


/* =====================================================
   SEARCH GOOGLE MAPS
===================================================== */

function setupSearch() {

    const input =
        document.getElementById(
            "searchInput"
        );


    /*
       Google Places Autocomplete.

       Ini yang membuat:
       "jakarta"
       "kalibata"
       "mall"
       "stasiun"
       dll

       menampilkan saran lokasi.
    */

    searchAutocomplete =
        new google.maps.places.Autocomplete(

            input,

            {

                fields: [

                    "geometry",

                    "name",

                    "formatted_address",

                    "place_id"

                ]

            }

        );


    searchAutocomplete.bindTo(
        "bounds",
        map
    );


    searchAutocomplete.addListener(

        "place_changed",

        function () {

            const place =
                searchAutocomplete.getPlace();


            if (
                !place.geometry ||
                !place.geometry.location
            ) {

                alert(
                    "Lokasi tidak ditemukan."
                );

                return;

            }


            const location =
                place.geometry.location;


            const lat =
                location.lat();


            const lng =
                location.lng();


            console.log(
                "Search:",
                place.name,

                lat,

                lng
            );


            /*
               Pindahkan map
            */

            map.panTo(
                location
            );


            map.setZoom(
                17
            );


            /*
               Marker hasil search
            */

            showSelectedMarker(
                lat,
                lng
            );


            /*
               Isi koordinat
            */

            setSelectedCoordinate(
                lat,
                lng
            );


            /*
               Isi nama
            */

            document.getElementById(
                "pointName"
            ).value =
                place.name || "";


            /*
               Buka panel
            */

            openPanel();

        }

    );

}


/* =====================================================
   CLEAR SEARCH
===================================================== */

function clearSearch() {

    const input =
        document.getElementById(
            "searchInput"
        );


    input.value = "";


    if (
        selectedMarker
    ) {

        selectedMarker.setMap(
            null
        );

        selectedMarker = null;

    }

}


document.addEventListener(

    "DOMContentLoaded",

    function () {

        document
            .getElementById(
                "clearSearch"
            )
            .addEventListener(
                "click",
                clearSearch
            );

    }

);


/* =====================================================
   CLICK MAP
===================================================== */

function setupMapClick() {

    map.addListener(

        "click",

        function (event) {

            const lat =
                event.latLng.lat();


            const lng =
                event.latLng.lng();


            console.log(
                "Map click:",
                lat,
                lng
            );


            setSelectedCoordinate(
                lat,
                lng
            );


            showSelectedMarker(
                lat,
                lng
            );


            /*
               Coba mendapatkan alamat
               berdasarkan koordinat.
            */

            reverseGeocode(
                lat,
                lng
            );


            openPanel();

        }

    );

}


/* =====================================================
   SELECT COORDINATE
===================================================== */

function setSelectedCoordinate(
    lat,
    lng
) {

    selectedCoordinate = {

        lat: Number(lat),

        lng: Number(lng)

    };


    document.getElementById(
        "pointLat"
    ).value =
        Number(lat).toFixed(6);


    document.getElementById(
        "pointLng"
    ).value =
        Number(lng).toFixed(6);

}


/* =====================================================
   TEMP MARKER
===================================================== */

function showSelectedMarker(
    lat,
    lng
) {

    if (
        selectedMarker
    ) {

        selectedMarker.setMap(
            null
        );

    }


    selectedMarker =
        new google.maps.Marker({

            position: {

                lat,

                lng

            },

            map,

            animation:
                google.maps.Animation.DROP,

            title:
                "Lokasi dipilih"

        });

}


/* =====================================================
   REVERSE GEOCODING
===================================================== */

function reverseGeocode(
    lat,
    lng
) {

    /*
       Geocoder hanya digunakan
       ketika user klik peta.
    */

    const geocoder =
        new google.maps.Geocoder();


    geocoder.geocode(

        {

            location: {

                lat,

                lng

            }

        },

        function (
            results,
            status
        ) {

            if (
                status !==
                "OK"
            ) {

                console.log(
                    "Geocoder:",
                    status
                );

                return;

            }


            if (
                !results ||
                !results.length
            ) {

                return;

            }


            const address =
                results[0]
                    .formatted_address;


            const nameInput =
                document.getElementById(
                    "pointName"
                );


            /*
               Jangan menimpa nama
               jika user sudah memilih
               hasil search.
            */

            if (
                !nameInput.value.trim()
            ) {

                nameInput.value =
                    address;

            }

        }

    );

}


/* =====================================================
   GPS
===================================================== */

function startGPS() {

    if (
        !navigator.geolocation
    ) {

        setGPSStatus(
            "Browser tidak mendukung GPS",
            false
        );

        return;

    }


    setGPSStatus(
        "Mencari posisi...",
        false
    );


    navigator.geolocation.getCurrentPosition(

        function (position) {

            updateDriverPosition(
                position
            );


            /*
               Pindahkan map ke posisi HP.
            */

            map.panTo({

                lat:
                    position.coords.latitude,

                lng:
                    position.coords.longitude

            });


            map.setZoom(
                17
            );


            /*
               Setelah mendapatkan
               posisi pertama, mulai tracking.
            */

            startGPSWatch();

        },


        function (error) {

            console.error(
                "GPS error:",
                error
            );


            handleGPSError(
                error
            );

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


/* =====================================================
   GPS WATCH
===================================================== */

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

            function (position) {

                updateDriverPosition(
                    position
                );

            },

            function (error) {

                console.error(
                    "GPS watch error:",
                    error
                );

            },

            {

                enableHighAccuracy:
                    true,

                maximumAge:
                    2000,

                timeout:
                    20000

            }

        );

}


/* =====================================================
   UPDATE DRIVER MARKER
===================================================== */

function updateDriverPosition(
    position
) {

    const lat =
        position.coords.latitude;


    const lng =
        position.coords.longitude;


    const accuracy =
        Math.round(
            position.coords.accuracy
        );


    const location = {

        lat,

        lng

    };


    console.log(
        "GPS:",
        lat,
        lng,
        "accuracy:",
        accuracy
    );


    setGPSStatus(

        `GPS aktif • ±${accuracy} m`,

        true

    );


    if (
        !driverMarker
    ) {

        driverMarker =
            new google.maps.Marker({

                position:
                    location,

                map,

                title:
                    "Posisi saya",

                icon: {

                    path:
                        google.maps.SymbolPath.CIRCLE,

                    scale:
                        9,

                    fillColor:
                        "#4285F4",

                    fillOpacity:
                        1,

                    strokeColor:
                        "#FFFFFF",

                    strokeWeight:
                        3

                }

            });

    }

    else {

        driverMarker.setPosition(
            location
        );

    }

}


/* =====================================================
   GPS ERROR
===================================================== */

function handleGPSError(
    error
) {

    switch (
        error.code
    ) {

        case 1:

            setGPSStatus(
                "Izin GPS ditolak",
                false
            );

            alert(
                "Akses lokasi ditolak.\n\n" +
                "Silakan izinkan lokasi untuk website ini di browser."
            );

            break;


        case 2:

            setGPSStatus(
                "Lokasi tidak tersedia",
                false
            );

            alert(
                "HP tidak berhasil mendapatkan lokasi."
            );

            break;


        case 3:

            setGPSStatus(
                "GPS timeout",
                false
            );

            alert(
                "GPS terlalu lama mendapatkan lokasi."
            );

            break;


        default:

            setGPSStatus(
                "GPS gagal",
                false
            );

    }

}


/* =====================================================
   GPS STATUS
===================================================== */

function setGPSStatus(
    text,
    active
) {

    const textElement =
        document.getElementById(
            "gpsText"
        );


    const statusElement =
        document.getElementById(
            "gpsStatus"
        );


    textElement.textContent =
        text;


    if (
        active
    ) {

        statusElement.classList.add(
            "gps-active"
        );

    }

    else {

        statusElement.classList.remove(
            "gps-active"
        );

    }

}


/* =====================================================
   BUTTON SETUP
===================================================== */

function setupButtons() {

    document
        .getElementById(
            "gpsButton"
        )
        .addEventListener(

            "click",

            function () {

                startGPS();

            }

        );


    document
        .getElementById(
            "addButton"
        )
        .addEventListener(

            "click",

            function () {

                openPanel();

            }

        );


    document
        .getElementById(
            "closePanel"
        )
        .addEventListener(

            "click",

            function () {

                closePanel();

            }

        );


    document
        .getElementById(
            "savePoint"
        )
        .addEventListener(

            "click",

            function () {

                savePoint();

            }

        );

}


/* =====================================================
   PANEL
===================================================== */

function openPanel() {

    document
        .getElementById(
            "pointPanel"
        )
        .classList.remove(
            "hidden"
        );

}


function closePanel() {

    document
        .getElementById(
            "pointPanel"
        )
        .classList.add(
            "hidden"
        );

}


/* =====================================================
   SAVE POINT
===================================================== */

function savePoint() {

    if (
        !selectedCoordinate
    ) {

        alert(
            "Pilih lokasi terlebih dahulu.\n\n" +
            "Bisa dengan klik peta atau cari lokasi."
        );

        return;

    }


    const name =
        document.getElementById(
            "pointName"
        ).value.trim();


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


    const point = {

        id:
            Date.now(),

        name,

        latitude:
            selectedCoordinate.lat,

        longitude:
            selectedCoordinate.lng,

        status,

        description,

        createdAt:
            new Date().toISOString()

    };


    const points =
        JSON.parse(

            localStorage.getItem(
                "ojol_points"
            ) || "[]"

        );


    points.push(
        point
    );


    localStorage.setItem(

        "ojol_points",

        JSON.stringify(
            points
        )

    );


    createSavedMarker(
        point
    );


    closePanel();


    clearPointForm();


    alert(
        "Titik berhasil disimpan."
    );

}


/* =====================================================
   CREATE SAVED MARKER
===================================================== */

function createSavedMarker(
    point
) {

    let markerColor =
        "#EA4335";


    if (
        point.status ===
        "Asli"
    ) {

        markerColor =
            "#34A853";

    }


    if (
        point.status ===
        "Survey"
    ) {

        markerColor =
            "#4285F4";

    }


    const marker =
        new google.maps.Marker({

            position: {

                lat:
                    Number(
                        point.latitude
                    ),

                lng:
                    Number(
                        point.longitude
                    )

            },

            map,

            title:
                point.name,

            icon: {

                path:
                    google.maps.SymbolPath.CIRCLE,

                scale:
                    9,

                fillColor:
                    markerColor,

                fillOpacity:
                    1,

                strokeColor:
                    "#FFFFFF",

                strokeWeight:
                    3

            }

        });


    const info =
        new google.maps.InfoWindow({

            content: `

                <div style="
                    min-width:220px;
                    font-family:Arial;
                    line-height:1.5;
                ">

                    <div style="
                        font-size:16px;
                        font-weight:bold;
                        margin-bottom:8px;
                    ">
                        ${escapeHTML(
                            point.name
                        )}
                    </div>


                    <div>
                        <b>Status:</b>
                        ${escapeHTML(
                            point.status
                        )}
                    </div>


                    <div>
                        <b>Latitude:</b>
                        ${Number(
                            point.latitude
                        ).toFixed(6)}
                    </div>


                    <div>
                        <b>Longitude:</b>
                        ${Number(
                            point.longitude
                        ).toFixed(6)}
                    </div>


                    ${
                        point.description
                        ?

                        `

                        <div style="
                            margin-top:8px;
                        ">

                            <b>
                                Keterangan:
                            </b>

                            <br>

                            ${escapeHTML(
                                point.description
                            )}

                        </div>

                        `

                        :

                        ""

                    }

                </div>

            `

        });


    marker.addListener(

        "click",

        function () {

            info.open(
                map,
                marker
            );

        }

    );

}


/* =====================================================
   LOAD SAVED POINTS
===================================================== */

function loadSavedPoints() {

    const points =
        JSON.parse(

            localStorage.getItem(
                "ojol_points"
            ) || "[]"

        );


    console.log(
        "Titik tersimpan:",
        points.length
    );


    points.forEach(

        function (point) {

            createSavedMarker(
                point
            );

        }

    );

}


/* =====================================================
   CLEAR FORM
===================================================== */

function clearPointForm() {

    document.getElementById(
        "pointName"
    ).value = "";


    document.getElementById(
        "pointLat"
    ).value = "";


    document.getElementById(
        "pointLng"
    ).value = "";


    document.getElementById(
        "pointDescription"
    ).value = "";


    selectedCoordinate =
        null;

}


/* =====================================================
   ESCAPE HTML
===================================================== */

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
