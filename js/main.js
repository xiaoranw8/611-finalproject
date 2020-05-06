// add Mapbox access token
mapboxgl.accessToken = "pk.eyJ1IjoieHJ3IiwiYSI6ImNrOWZ2NDJoYzA5cTczZXBueHdmMWFqeWoifQ.xDiLhWviR4rm1ryO_6frlw";

var map = new mapboxgl.Map({
  container: 'map', // Specify the container ID
  style: 'mapbox://styles/mapbox/streets-v11', // Specify which map style to use
  center: [-75.242229, 40.001036], // Specify the starting position
  zoom: 10.2, // Specify the starting zoom
});

var mkt = "https://raw.githubusercontent.com/xiaoranw8/musa-611-midterm/master/mkt_new.geojson";
var hoods = "https://raw.githubusercontent.com/xiaoranw8/musa-611-midterm/master/hoods_clean.geojson";
var boundary = "https://raw.githubusercontent.com/xiaoranw8/musa-611-midterm/master/City_Limits.geojson";

// read market location from url and save as variable
var marketData;
$.ajax(mkt).done(function(data) {
  marketData = JSON.parse(data);
});
// $.getJSON(mkt, function(data) {
//   marketData = data;
// });

// Create variables for iso
var urlBase = 'https://api.mapbox.com/isochrone/v1/mapbox/';
var lon; // to be determined by clicking
var lat; // to be determined by clicking
var profile = "driving"; // set the default mode and minutes
var minutes = 10;
var theMarker;


$(document).ready(function() {
  map.on('load', function(){
    // add philly boundary
    map.addSource('limits', {
      type: 'geojson',
      data: boundary
    });

    map.addLayer({
      'id': 'limits',
      'type': 'line',
      'source': 'limits',
      'layout': {},
      'paint': {
        'line-width': 2,
        'line-color': "#540000"
      }
    });

    // add market locations
    map.addSource('location', {
      type: 'geojson',
      data: mkt
    });

    map.addLayer({
      'id': 'location',
      'type': 'circle',
      'source': 'location',
      'layout': {},
      'paint': {
        'circle-radius': 5,
        // color circles by grocery type
        'circle-color': ['match', ['get', 'type'], 'Supermarket', '#4FA0D3', 'Farmers market', '#ffb14e', /* other */ '#030204'],
        'circle-opacity': 1
      }
    });


    // make it clickable: trigger table at side bar and iso
    map.on('click', 'location', function(e) {
      var coordinates = e.features[0].geometry.coordinates.slice();
      //var description = "Grocery Name: " + e.features[0].properties.name;
      $('#message').hide();
      $('#detail').show();
      $('#groname').text(e.features[0].properties.name);
      $('#address').text(e.features[0].properties.address);
      $('#neighborhood').text(e.features[0].properties.mapname);
      $('#hour').text(e.features[0].properties.time);
      $('#mon').text(e.features[0].properties.month);

      // clicking to set lon and lat for iso
      lon = coordinates[0];
      lat = coordinates[1];
      // set up iso API and make ajax call
      var query = urlBase + profile + '/' + lon + ',' + lat + '?contours_minutes=' + minutes + '&polygons=true&access_token=' + mapboxgl.accessToken;
      $.ajax({
        method: 'GET',
        url: query
      }).done(function(data) {
        map.getSource('iso').setData(data);
      });

      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

//// How to remove previous marker automatically when clicking to add new marker ////
      // add marker for selected location, and remove existing marker
      if (theMarker != undefined) {
        map.removeLayer(theMarker);
      } else {
        theMarker = new mapboxgl.Marker().setLngLat(coordinates).addTo(map);
      }

      // set popup
      // new mapboxgl.Popup()
      //     .setLngLat(coordinates)
      //     .setHTML(description)
      //     .addTo(map);
    });

    // When the map loads, add the iso source and layer
    map.addSource('iso', {
      type: 'geojson',
      data: {
        'type': 'FeatureCollection',
        'features': []
      }
    });
    // add iso layer
    map.addLayer({
      'id': 'isoLayer',
      'type': 'fill',
      // Use "iso" as the data source for this layer
      'source': 'iso',
      'layout': {},
      'paint': {
        'fill-color': '#5a3fc0',
        'fill-opacity': 0.3
      }
    }, "poi-label");

    // add mouseover for the point layer
    map.on('mouseenter', 'location', function() {
      map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'location', function() {
      map.getCanvas().style.cursor = '';
    });
  });
});

// use bootstrap button to choose the mode and duration for iso
$('#modes').on('change', function(e){
  profile = e.target.value;
});
$('#duration').on('change', function(e){
  minutes = e.target.value;
});


$('#geolocate').on('click', function(){
  var geolocate = new mapboxgl.GeolocateControl();

  map.addControl(geolocate);

  geolocate.on('geolocate', function(e) {
        var lon = e.coords.longitude;
        var lat = e.coords.latitude;
        var position = [lon, lat];
        console.log(position);
  });
});


// reset the map
// $("#clear").click(function() {
// });
